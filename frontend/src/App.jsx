
import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  MapPin,
  Activity,
  Clock,
  AlertTriangle,
  Menu,
  Bell,
  Navigation,
  CheckCircle,
  Bike,
  Radio,
} from "lucide-react";
import "./App.css";

function App() {
  
  const sendEmergencyAlert = async (location) => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/emergency/alert",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            incidentType: "PRESUMED_ACCIDENT",
            incidentTime: new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      setSosMessage(data.message);
    } catch (error) {
      console.error("Emergency alert error:", error);
      setSosMessage(
        "Location available, but backend connection failed."
      );
    }
  };

  const [activeTab, setActiveTab] = useState("Overview");
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [sosMessage, setSosMessage] = useState("");
  const [emergencyActive, setEmergencyActive] = useState(false);
  const alertSentRef = useRef(false);
  const [riderLocation, setRiderLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Waiting for location");

  
useEffect(() => {
  if (!sosActive) return;

  

if (countdown <= 0) {
  setSosActive(false);
  setEmergencyActive(true);
  setSosMessage(
    "PRESUMED ACCIDENT: Emergency escalation activated."
  );

  return;
}



  let audioContext;

  try {
    audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    const beep = () => {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sawtooth";
      oscillator.frequency.value = 240;
      gain.gain.value = 0.3;

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    };

    beep();

    const beepInterval = setInterval(beep, 1000);

    const timer = setTimeout(() => {
      setCountdown((seconds) => seconds - 1);
    }, 1000);

    return () => {
      clearInterval(beepInterval);
      clearTimeout(timer);
      audioContext.close();
    };
  } catch (error) {
    const timer = setTimeout(() => {
      setCountdown((seconds) => seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }
}, [sosActive, countdown]);

useEffect(() => {
  if (!emergencyActive) return;

  if (!navigator.geolocation) {
    setLocationStatus("Location is not supported by this browser.");
    return;
  }

  setLocationStatus("Requesting rider location...");

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
  const location = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: Math.round(position.coords.accuracy),
  };

  setRiderLocation(location);
  setLocationStatus("Location updated successfully");

  if (!alertSentRef.current) {
    alertSentRef.current = true;
    sendEmergencyAlert(location);
  }
},
(error) => {
  console.error("ResQRide location error:", error);

  const messages = {
    1: "Location permission denied. Allow location in browser settings.",
    2: "Location unavailable. Check your device location settings.",
    3: "Location request timed out. Please try again.",
  };

  setLocationStatus(
    messages[error.code] || "Unknown location error."
  );
},

    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}, [emergencyActive]);



  const navItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Live Tracking", icon: MapPin },
    { name: "Ride History", icon: Clock },
    { name: "Safety Reports", icon: ShieldCheck },
  ];

  return (
    

<div className={`app-shell ${
  sosActive || emergencyActive ? "crash-alert-active" : ""
}`}>
{ sosMessage && (
  <div className="sos-message">
    {sosMessage}
  </div>
)}

{emergencyActive && (
  <div className="sos-timer emergency-location-panel">
    <div className="warning-indicator">
      <span className="warning-dot" />
      EMERGENCY MODE ACTIVE
    </div>

    <h3>Rider Location</h3>

    <p>{locationStatus}</p>

    {riderLocation ? (
      <>
        <p>
          Latitude: {riderLocation.latitude.toFixed(6)}
        </p>
        <p>
          Longitude: {riderLocation.longitude.toFixed(6)}
        </p>
        <p>
          Accuracy: approximately {riderLocation.accuracy} metres
        </p>

        <a
          href={`https://www.google.com/maps?q=${riderLocation.latitude},${riderLocation.longitude}`}
          target="_blank"
          rel="noreferrer"
        >
          Open rider location in Google Maps
        </a>
      </>
    ) : (
      <p>Waiting for an available location fix...</p>
    )}

    <p>
      Emergency contacts: notification integration not connected.
    </p>

    <button
      className="safe-button"
      onClick={() => {
        setEmergencyActive(false);
        alertSentRef.current = false;
        setSosActive(false);
        setCountdown(30);
        setRiderLocation(null);
        setLocationStatus("Waiting for location");
        setSosMessage("Emergency demo reset.");
      }}
    >
      RESET EMERGENCY DEMO
    </button>
  </div>
)}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={27} /></div>
          <div>
            <h2>ResQRide</h2>
            <span>RIDER SAFETY SYSTEM</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${activeTab === name ? "active" : ""}`}
              onClick={() => setActiveTab(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="protection-badge">
            <ShieldCheck size={22} />
            <div>
              <strong>Safety first</strong>
              <p>Your journey matters.</p>
            </div>
          </div>
          <p className="version">ResQRide · Prototype v1.0</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Menu">
            <Menu size={22} />
          </button>
          <div className="breadcrumb">Workspace / <strong>{activeTab}</strong></div>
          <div className="topbar-right">
            <span className="system-status"><span /> System Online</span>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
            </button>
            <div className="avatar">R</div>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">INTELLIGENT RIDER SAFETY</p>
              <h1>{activeTab === "Overview" ? "Safety Dashboard" : activeTab}</h1>
              <p className="subtitle">
                Monitor your rides and stay informed throughout your journey.
              </p>
            </div>
            <div className="date-chip"><Radio size={15} /> Monitoring preview</div>
          </div>

          <div className="hero-card">
            <div className="hero-copy">
              <span className="hero-tag"><ShieldCheck size={15} /> RIDER PROTECTION</span>
              <h2>Every journey deserves<br />a safer ride.</h2>
              <p>ResQRide brings ride monitoring and safety information into one place.</p>
              <button className="hero-button" onClick={() => setActiveTab("Live Tracking")}>
                <Navigation size={17} /> Explore ride tracking
              </button>
            </div>
            <div className="hero-art">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="hero-shield"><ShieldCheck size={86} strokeWidth={1.4} /></div>
              <div className="floating-pin"><MapPin size={21} /></div>
              <div className="floating-check"><CheckCircle size={21} /></div>
            </div>
          </div>

          <div className="section-heading">
            <div>
              <h2>Safety overview</h2>
              <p>A quick look at your demo environment</p>
            </div>
            <span className="demo-label">DEMO DATA</span>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top"><span className="stat-icon purple"><Bike size={21} /></span><span className="stat-caption">RIDES</span></div>
              <h3>12</h3><p>Total rides recorded <span className="positive">+3 this week</span></p>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span className="stat-icon green"><ShieldCheck size={21} /></span><span className="stat-caption">SAFETY</span></div>
              <h3>98.5%</h3><p>Demo safety score</p>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span className="stat-icon orange"><Activity size={21} /></span><span className="stat-caption">MONITORING</span></div>
              <h3>Ready</h3><p>Live sensors not connected</p>
            </div>
          </div>

          <div className="lower-grid">
            <section className="panel ride-panel">
              <div className="panel-heading">
                <div><h2>Ride monitoring</h2><p>Current demo session</p></div>
                <span className="status-pill"><span /> Standby</span>
              </div>
              <div className="map-preview">
                <div className="map-grid" />
                <div className="map-road road-a" />
                <div className="map-road road-b" />
                <div className="map-road road-c" />
                <div className="map-marker"><MapPin size={24} /></div>
                <div className="map-label">Demo location</div>
                <div className="map-watermark">MAP PREVIEW</div>
              </div>
              <div className="ride-details">
                <div><span className="detail-icon"><MapPin size={17} /></span><div><small>Location</small><strong>Not connected</strong></div></div>
                <div><span className="detail-icon"><Clock size={17} /></span><div><small>Ride duration</small><strong>--:--</strong></div></div>
              </div>
            </section>

            <section className="panel alerts-panel">
              <div className="panel-heading">
                <div><h2>Safety center</h2><p>Quick actions and updates</p></div>
                <span className="alert-icon"><AlertTriangle size={19} /></span>
              </div>
              <div className="safety-notice">
                <CheckCircle size={20} />
                <div><strong>Demo mode active</strong><p>This prototype isn't connected to live ride data.</p></div>
              </div>
              <div className="action-row">
                <div className="action-icon"><ShieldCheck size={19} /></div>
                <div className="action-copy"><strong>Safety status</strong><span>Interface operational</span></div>
                <CheckCircle className="action-check" size={19} />
              </div>
              <button
                className={`sos-button ${sosActive ? "sos-confirmed" : ""}`}
                onClick={() => {
  if (!sosActive) {
    setCountdown(30);
    setSosMessage("");
    setSosActive(true);
  } else {
    setSosActive(false);
    setCountdown(30);
    setSosMessage("SOS demo cancelled.");
  }
}}
              >
                <AlertTriangle size={19} />
                {sosActive ? "Demo alert selected" : "Test SOS interface"}
              </button>
{sosActive && (
  <div className="sos-timer">
    <div className="warning-indicator">
      <span className="warning-dot"></span>
      POSSIBLE CRASH DETECTED
    </div>

    <h3>Are you safe?</h3>

    <div className="timer-display">
      00:{String(countdown).padStart(2, "0")}
    </div>

    <p>
      Please confirm your safety before the countdown ends.
    </p>

    <button
      className="safe-button"
      onClick={() => {
        setSosActive(false);
        setCountdown(30);
        setSosMessage("Safety confirmed. Demo alert cancelled.");
      }}
    >
      ✓ I'M SAFE — NO CRASH
    </button>

    <p className="demo-note">
      Demonstration only · No real emergency alert is sent
    </p>
  </div>
)}


{sosMessage && (
  <div className="sos-message">
    {sosMessage}
  </div>
)}
              {sosActive && <p className="sos-note">Demo only. No alert was sent to emergency services.</p>}
              <p className="panel-footnote">SOS is a visual demonstration only.</p>
            </section>
          </div>

          <footer className="page-footer">
            <span>© 2026 ResQRide · Intelligent Rider Safety System</span>
            <span><ShieldCheck size={14} /> Designed with safety in mind</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
