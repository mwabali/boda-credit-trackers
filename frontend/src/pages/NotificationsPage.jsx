import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from '../components/ToastProvider'
import { request } from '../lib/api'
import styles from './NotificationsPage.module.css'

function NotificationsPage() {
  const { user, refreshSession } = useAuth()
  const { showError, showSuccess } = useToast()
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const isPendingStationUser =
    user?.role === 'station' && user?.approvalStatus && user.approvalStatus !== 'approved'

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([])
      setPendingApprovals([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const payload = await request('/notifications')
      setNotifications(payload.data?.notifications || [])
      setPendingApprovals(payload.data?.pendingStationApprovals || [])
    } catch (error) {
      setNotifications([])
      setPendingApprovals([])
      showError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [showError, user?.id])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    setNotifications([])
    setPendingApprovals([])
  }, [user?.id])

  useEffect(() => {
    if (location.state?.pendingApproval) {
      showError(
        'Your station manager account is still pending approval. You can only access notifications for now.',
        'Approval pending'
      )
    }
  }, [location.state, showError])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  )

  const markAsRead = async (notificationId) => {
    try {
      await request(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      )
    } catch (error) {
      showError(error.message)
    }
  }

  const reviewStationAccess = async (accountId, decision) => {
    try {
      await request(`/notifications/station-approvals/${accountId}`, {
        method: 'PATCH',
        body: JSON.stringify({ decision }),
      })
      showSuccess(
        decision === 'approved'
          ? 'The station manager account has been approved.'
          : 'The station manager account has been declined.',
        'Approval updated'
      )
      await loadNotifications()
      await refreshSession()
    } catch (error) {
      showError(error.message)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Notifications</h1>
        <p className={styles.description}>
          Stay current on approvals, updates, and activity relevant to your account.
        </p>
      </header>

      {isPendingStationUser ? (
        <section className={styles.pendingBanner}>
          <h2>Approval pending</h2>
          <p>
            Your station manager account is waiting for company approval. Once approved, your
            station dashboard and data pages will unlock automatically.
          </p>
        </section>
      ) : null}

      {user?.role === 'company' && pendingApprovals.length > 0 ? (
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2>Pending station approvals</h2>
            <span>{pendingApprovals.length} awaiting review</span>
          </div>

          <div className={styles.approvalList}>
            {pendingApprovals.map((approval) => (
              <article key={approval.id} className={styles.approvalCard}>
                <div className={styles.approvalBody}>
                  <h3>{approval.fullName}</h3>
                  <p>{approval.email}</p>
                  <p>{approval.station?.displayName || 'Station pending lookup'}</p>
                </div>
                <div className={styles.approvalActions}>
                  <button
                    type="button"
                    className={styles.approveButton}
                    onClick={() => reviewStationAccess(approval.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className={styles.rejectButton}
                    onClick={() => reviewStationAccess(approval.id, 'rejected')}
                  >
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2>Inbox</h2>
          <span>{unreadCount} unread</span>
        </div>

        {isLoading ? <p className={styles.emptyState}>Loading notifications...</p> : null}

        {!isLoading && notifications.length === 0 ? (
          <p className={styles.emptyState}>No notifications yet.</p>
        ) : null}

        {!isLoading && notifications.length > 0 ? (
          <div className={styles.notificationList}>
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`${styles.notificationCard} ${
                  notification.isRead ? styles.notificationRead : ''
                }`}
              >
                <div className={styles.notificationBody}>
                  <p className={styles.notificationType}>{notification.type}</p>
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                </div>
                {!notification.isRead ? (
                  <button
                    type="button"
                    className={styles.readButton}
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark as read
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default NotificationsPage
