const RoleSelection = ({ value, onChange }) => (
  <label>
    Role
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="client">Client</option>
      <option value="trainer">Trainer</option>
      <option value="admin">Admin</option>
    </select>
  </label>
);

export default RoleSelection;
