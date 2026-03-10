import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

const Placeholder = ({ title, description }) => (
  <main className="appShell">
    <section className="welcomeCard">
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  </main>
)

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route
        path="/home"
        element={
          <Placeholder
            title="Boda Credit Tracker"
            description="Home route ready. Dashboard content will be expanded in later stages."
          />
        }
      />
      <Route
        path="/riders"
        element={
          <Placeholder
            title="Riders"
            description="Rider management route is configured and ready for page implementation."
          />
        }
      />
      <Route
        path="/stations"
        element={
          <Placeholder
            title="Fuel Stations"
            description="Station management route is configured and ready for page implementation."
          />
        }
      />
      <Route
        path="/transactions"
        element={
          <Placeholder
            title="Transactions"
            description="Transaction tracking route is configured and ready for page implementation."
          />
        }
      />
      <Route
        path="/add-credit"
        element={
          <Placeholder
            title="Add Credit"
            description="Credit entry route is configured and ready for page implementation."
          />
        }
      />
    </Routes>
  )
}

export default App
