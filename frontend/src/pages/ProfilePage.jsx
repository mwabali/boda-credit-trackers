import { useMemo } from 'react'
import { useAuth } from '../auth/AuthProvider'
import styles from './ProfilePage.module.css'

function formatRoleLabel(role) {
  if (role === 'company') return 'Company administrator'
  if (role === 'sacco') return 'SACCO administrator'
  if (role === 'station') return 'Station manager'
  return 'Rider account'
}

function ProfilePage() {
  const { user } = useAuth()

  const initials = useMemo(() => {
    const parts = (user?.fullName || 'User')
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2)
    return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'U'
  }, [user?.fullName])

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.description}>
          Review the account details currently associated with your Boda Credit access.
        </p>
      </header>

      <section className={styles.profileShell}>
        <article className={styles.identityCard}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.identityBody}>
            <p className={styles.roleTag}>{formatRoleLabel(user?.role)}</p>
            <h2>{user?.fullName || 'Signed in user'}</h2>
            <p>{user?.email || 'No email available'}</p>
            <span
              className={`${styles.statusChip} ${
                user?.approvalStatus === 'approved' ? styles.statusApproved : styles.statusPending
              }`}
            >
              {user?.approvalStatus === 'approved' ? 'Access approved' : 'Approval pending'}
            </span>
          </div>
        </article>

        <article className={styles.detailCard}>
          <h2>Account details</h2>
          <dl className={styles.detailGrid}>
            <div>
              <dt>Portal</dt>
              <dd>{formatRoleLabel(user?.role)}</dd>
            </div>
            <div>
              <dt>Organization</dt>
              <dd>{user?.companyName || 'Not available'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email || 'Not available'}</dd>
            </div>
            <div>
              <dt>Account status</dt>
              <dd>{user?.approvalStatus || 'approved'}</dd>
            </div>
          </dl>
        </article>

        {user?.role === 'station' ? (
          <article className={styles.detailCard}>
            <h2>Station assignment</h2>
            <dl className={styles.detailGrid}>
              <div>
                <dt>Station</dt>
                <dd>{user?.station?.displayName || 'Awaiting assignment'}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{user?.station?.location || 'Pending approval'}</dd>
              </div>
            </dl>
          </article>
        ) : null}

        {user?.role === 'rider' ? (
          <article className={styles.detailCard}>
            <h2>Rider record</h2>
            <dl className={styles.detailGrid}>
              <div>
                <dt>Name</dt>
                <dd>{user?.rider?.name || user?.fullName || 'Not available'}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{user?.rider?.phone || 'Not available'}</dd>
              </div>
              <div>
                <dt>Number plate</dt>
                <dd>{user?.rider?.licensePlate || 'Not available'}</dd>
              </div>
            </dl>
          </article>
        ) : null}

        {user?.role === 'company' ? (
          <article className={styles.detailCard}>
            <h2>Administrative access</h2>
            <p className={styles.companySummary}>
              Your company account can enlist stations, review station manager approval requests,
              and oversee company-wide credit operations.
            </p>
          </article>
        ) : null}

        {user?.role === 'sacco' ? (
          <article className={styles.detailCard}>
            <h2>SACCO oversight access</h2>
            <p className={styles.companySummary}>
              Your SACCO account can monitor member riders, repayment history, outstanding
              balances, and fuel-credit records across participating stations.
            </p>
          </article>
        ) : null}
      </section>
    </main>
  )
}

export default ProfilePage
