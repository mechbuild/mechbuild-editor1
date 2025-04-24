// src/pages/HomePage.jsx
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import ZoneTable from '../components/ZoneTable';

function HomePage() {
  const { user, logout } = useUser();
  const [command, setCommand] = useState("");       // current command input
  const [outputs, setOutputs] = useState([]);       // list of output logs

  // Sample data for zone analysis (could be dynamic in a real app)
  const zones = [
    { name: "Head", value: "OK" },
    { name: "Torso", value: "OK" },
    { name: "Left Arm", value: "Damaged" },
    { name: "Right Arm", value: "OK" },
    { name: "Legs", value: "OK" }
  ];

  // Handle command submission
  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (command.trim() === "") return;
    // For now, just echo the command to outputs
    setOutputs(prev => [...prev, `Executed command: ${command}`]);
    setCommand(""); // clear input
  };

  return (
    <div>
      <h2>Welcome, {user && user.username}!</h2>

      {/* Command input form */}
      <section>
        <h3>Command Console</h3>
        <form onSubmit={handleCommandSubmit}>
          <input 
            type="text" 
            placeholder="Enter command" 
            value={command} 
            onChange={e => setCommand(e.target.value)} 
          />
          <button type="submit">Run</button>
        </form>
      </section>

      {/* Output panel for command results */}
      <section>
        <h3>Output Panel</h3>
        <div style={{ background: "#f0f0f0", padding: "1em", minHeight: "100px" }}>
          {outputs.length === 0 ? (
            <p><em>No output yet</em></p>
          ) : (
            outputs.map((out, idx) => <div key={idx}>➜ {out}</div>)
          )}
        </div>
      </section>

      {/* Zone analysis table */}
      <section>
        <h3>Zone Analysis</h3>
        <ZoneTable zones={zones} />
      </section>

      {/* Logout button */}
      <button onClick={logout} style={{ marginTop: "1em" }}>Logout</button>
    </div>
  );
}

export default HomePage;
