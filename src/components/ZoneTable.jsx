// src/components/ZoneTable.jsx
import React from 'react';

function ZoneTable({ zones }) {
  return (
    <table border="1" cellPadding="8">
      <thead>
        <tr>
          <th>Zone</th>
          <th>Status/Value</th>
        </tr>
      </thead>
      <tbody>
        {zones.map((zone, idx) => (
          <tr key={idx}>
            <td>{zone.name}</td>
            <td>{zone.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ZoneTable;
