# Manager Refactoring Implementation Plan

## DETAILED PHASE-BY-PHASE RESTORATION PLAN

---

## PHASE 1: AllianceManager Restoration

### Current Issues:
1. ✅ Uses `useForm` hook (good!)
2. ❌ Template literal bug: `${editingId}` should be `${editingId.alliance_name}`
3. ❌ Displays "No members" because not fetching member data
4. ⚠️ Custom `handleSeasonChange` with Promise.all - should use useEffect
5. ⚠️ Error filtering logic for edit mode is fragile

### Step-by-Step Fixes:

#### Fix 1: Alliance Name Display in Header
**Current:**
```javascript
<h2>{editingId ? `Edit Alliance: ${editingId}` : 'Create New Alliance'}</h2>
```

**Fixed:**
```javascript
<h2>{editingId ? `Edit Alliance: ${editingId.alliance_name}` : 'Create New Alliance'}</h2>
```

#### Fix 2: Convert handleSeasonChange to useEffect Pattern
**Current:**
```javascript
const handleSeasonChange = (seasonNum) => {
  setSelectedSeason(seasonNum);
  setEditingId(null);
  if (seasonNum) {
    setLoadingPlayers(true);
    setLoadingAlliances(true);
    Promise.all([
      neo4jService.getPlayersInSeason(seasonNum),
      neo4jService.getAlliancesInSeason(seasonNum)
    ])
      .then(([players, alliances]) => {
        setPlayersInSeason(players);
        setAlliances(alliances);
      })
      .catch(err => {
        setErrorMessage(`Failed to load data: ${err.message}`);
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => {
        setLoadingPlayers(false);
        setLoadingAlliances(false);
      });
  } else {
    setPlayersInSeason([]);
    setAlliances([]);
  }
};
```

**Refactored to:**
```javascript
// Load players when season changes
useEffect(() => {
  if (selectedSeason) {
    setLoadingPlayers(true);
    neo4jService.getPlayersInSeason(selectedSeason)
      .then(setPlayersInSeason)
      .catch(err => {
        setErrorMessage(`Failed to load players: ${err.message}`);
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => setLoadingPlayers(false));
  } else {
    setPlayersInSeason([]);
  }
}, [selectedSeason]);

// Load alliances when season changes
useEffect(() => {
  if (selectedSeason) {
    setLoadingAlliances(true);
    neo4jService.getAlliancesInSeason(selectedSeason)
      .then(setAlliances)
      .catch(err => {
        setErrorMessage(`Failed to load alliances: ${err.message}`);
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => setLoadingAlliances(false));
  } else {
    setAlliances([]);
  }
}, [selectedSeason]);

// Update season selector onChange
<select
  id="season_select"
  value={selectedSeason || ''}
  onChange={(e) => {
    const seasonNum = Number(e.target.value) || null;
    setSelectedSeason(seasonNum);
    setEditingId(null);
  }}
  // ...
>
```

#### Fix 3: Simplify Error Checking
**Current:**
```javascript
const relevantErrors = editingId 
  ? Object.fromEntries(Object.entries(errors).filter(([key]) => key !== 'alliance_name'))
  : errors;

const formHasErrors = hasErrors(relevantErrors);
```

**Better (follow TribeManager pattern):**
```javascript
// When editing, disable the alliance_name input, so its validation doesn't matter
// Just check if form has errors, but set disabled={editingId !== null} on the field
const formHasErrors = hasErrors(errors);

// In the input:
<input
  id="alliance_name"
  name="alliance_name"
  type="text"
  value={values.alliance_name}
  onChange={handleChange}
  placeholder="e.g., The Poker Alliance"
  disabled={editingId !== null}  // ← Prevent changes
  className={errors.alliance_name ? 'input-error' : ''}
/>
```

#### Fix 4: Fix Alliance Members Display
**Current:**
```javascript
<div className="alliance-members">
  <strong>Members ({alliance.members?.length || 0}):</strong>
  <p>{alliance.members?.join(', ') || 'No members'}</p>
</div>
```

**Issue:** `alliance.members` doesn't exist in neo4j response

**Solution:** Either:
- Option A: Fetch member data in neo4j query
- Option B: Remove this section temporarily until members feature is implemented
- Option C: Show member count from alliance size instead

**Recommended (Option C):**
```javascript
<div className="alliance-info">
  <p><strong>Formation Episode:</strong> {alliance.formation_episode}</p>
  {alliance.dissolved_episode && (
    <p><strong>Dissolved Episode:</strong> {alliance.dissolved_episode}</p>
  )}
  <p><strong>Size:</strong> {alliance.size} members</p>
</div>
```

#### Fix 5: Remove Status Badge
**Current:**
```javascript
<span className={`status-badge status-${alliance.status || 'active'}`}>
  {alliance.status || 'Active'}
</span>
```

**Issue:** No `alliance.status` field

**Solution:** Remove or replace with calculated status
```javascript
{/* Show if active or dissolved based on dissolved_episode */}
{!alliance.dissolved_episode ? (
  <span className="badge badge-active">Active</span>
) : (
  <span className="badge badge-dissolved">Dissolved</span>
)}
```

---

## PHASE 2: DraftManager Restoration

### Current Issues:
1. ❌ Does NOT use `useForm` hook
2. ❌ No validation system
3. ❌ Custom message handling system
4. ❌ Missing back link
5. ❌ Missing Link import
6. ⚠️ Hardcoded 10-team assumption
7. ⚠️ No update mutation

### Step-by-Step Fixes:

#### Fix 1: Add Missing Imports
**Add to imports:**
```javascript
import { Link } from 'react-router-dom';
```

#### Fix 2: Convert Message System to Standard Pattern
**Current:**
```javascript
const [messages, setMessages] = useState([]);

const addMessage = (text, type) => {
  const id = Date.now();
  setMessages((prev) => [...prev, { id, text, type }]);
  setTimeout(() => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, 3000);
};

// Usage:
addMessage('Draft pick created successfully!', 'success');
addMessage(`Error creating draft pick: ${err.message}`, 'error');

// Rendering:
<div className="messages-container">
  {messages.map((msg) => (
    <div key={msg.id} className={`message ${msg.type}`}>
      {msg.text}
    </div>
  ))}
</div>
```

**Refactored to:**
```javascript
const [successMessage, setSuccessMessage] = useState('');
const [errorMessage, setErrorMessage] = useState('');

// No function needed, just set directly
// Usage:
setSuccessMessage('Draft pick created successfully!');
setTimeout(() => setSuccessMessage(''), 3000);

// Error:
setErrorMessage(`Error creating draft pick: ${err.message}`);
setTimeout(() => setErrorMessage(''), 3000);

// Rendering:
{successMessage && (
  <div className="message message-success">
    ✓ {successMessage}
  </div>
)}
{errorMessage && (
  <div className="message message-error">
    ✕ {errorMessage}
  </div>
)}
```

#### Fix 3: Add Validation System
**Add validation rules import:**
```javascript
import { draftPickValidation, hasErrors } from '../../utils/validation';
```

**Add to state (replace custom form states):**
```javascript
// Remove individual state, use form for draft pick management
const { values, errors, handleChange, handleSubmit, resetForm, setValues } = useForm(
  { round: draftRound, pick_number: draftPick },
  async (formValues) => {
    // Handle auto-increment
    const nextPick = formValues.pick_number === teams.length ? 1 : formValues.pick_number + 1;
    const nextRound = formValues.pick_number === teams.length ? formValues.round + 1 : formValues.round;
    setDraftRound(nextRound);
    setDraftPick(nextPick);
  },
  draftPickValidation
);
```

#### Fix 4: Fix Auto-Increment Logic
**Current:**
```javascript
const nextPick = draftPick === 10 ? 1 : draftPick + 1;
const nextRound = draftPick === 10 ? draftRound + 1 : draftRound;
```

**Fixed (use actual team count):**
```javascript
const nextPick = draftPick === teams.length ? 1 : draftPick + 1;
const nextRound = draftPick === teams.length ? draftRound + 1 : draftRound;
```

#### Fix 5: Add Back Link
**Add at bottom of component, before closing div:**
```javascript
<Link to="/admin" className="back-link">← Back to Admin</Link>
```

#### Fix 6: Update Mutation Error Handling
**Refactor mutations to use standard pattern:**
```javascript
const { mutate: createDraftPick } = useMutation(
  (teamName, playerName) =>
    neo4jService.createDraftPick(
      selectedSeason,
      draftRound,
      draftPick,
      playerName,
      teamName
    ),
  () => {
    setSuccessMessage('Draft pick created successfully!');
    const nextPick = draftPick === teams.length ? 1 : draftPick + 1;
    const nextRound = draftPick === teams.length ? draftRound + 1 : draftRound;
    setDraftPick(nextPick);
    setDraftRound(nextRound);
    setTeamPlayerSelections({});
    refetchDraftPicks();
    refetchPlayers();
    setTimeout(() => setSuccessMessage(''), 3000);
  },
  (err) => {
    setErrorMessage(`Error creating draft pick: ${err.message}`);
    setTimeout(() => setErrorMessage(''), 3000);
  }
);
```

---

## PHASE 3: FantasyTeamManager Restoration

### Current Issues:
1. ❌ Does NOT use `useForm` hook
2. ❌ Manual validation logic
3. ❌ Custom message handling
4. ❌ Missing back link
5. ❌ Missing Link import
6. ❌ Wrong CSS import (DraftManager.css instead of FantasyTeamManager.css)
7. ❌ Form validity check different from standard

### Step-by-Step Fixes:

#### Fix 1: Fix CSS Import
**Current:**
```javascript
import '../../styles/DraftManager.css';
```

**Fixed:**
```javascript
import '../../styles/FantasyTeamManager.css';
```

#### Fix 2: Add Missing Imports
**Add:**
```javascript
import { Link } from 'react-router-dom';
import { useForm } from '../../hooks/useNeo4j';
import { fantasyTeamValidation, hasErrors } from '../../utils/validation';
```

#### Fix 3: Convert to useForm Hook
**Current (manual state):**
```javascript
const [formMode, setFormMode] = useState('create');
const [editingTeam, setEditingTeam] = useState(null);
const [teamName, setTeamName] = useState('');
const [ownerNames, setOwnerNames] = useState('');

const handleSubmitTeam = (e) => {
  e.preventDefault();
  
  if (!teamName.trim()) {
    addMessage('Team name is required', 'error');
    return;
  }
  // ... manual validation
};
```

**Refactored to:**
```javascript
const [editingTeam, setEditingTeam] = useState(null);

const { values, errors, handleChange, handleSubmit, resetForm, setValues } = useForm(
  { team_name: '', owner_names: '' },
  async (formValues) => {
    if (!selectedSeason) {
      setErrorMessage('Please select a season first');
      return;
    }

    const owners = formValues.owner_names
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (editingTeam) {
      await updateTeam(editingTeam.team_name, owners);
    } else {
      await createTeam(formValues.team_name, owners, selectedSeason);
    }
  },
  fantasyTeamValidation
);
```

#### Fix 4: Convert Message System
**Same as DraftManager - replace custom addMessage with successMessage/errorMessage**

#### Fix 5: Update Form Rendering
**Instead of:**
```javascript
<div className="form-group">
  <label htmlFor="team_name">Team Name</label>
  <input
    id="team_name"
    type="text"
    value={teamName}
    onChange={(e) => setTeamName(e.target.value)}
    disabled={formMode === 'edit'}
    className={teamName.length < 2 && teamName ? 'input-error' : ''}
  />
  {teamName && (teamName.length < 2 || teamName.length > 100) && (
    <span className="error-message">Team name must be 2-100 characters</span>
  )}
</div>
```

**Use:**
```javascript
<div className="form-group">
  <label htmlFor="team_name">Team Name *</label>
  <input
    id="team_name"
    name="team_name"
    type="text"
    value={values.team_name}
    onChange={handleChange}
    placeholder="e.g., The Champions"
    disabled={editingTeam !== null}
    className={errors.team_name ? 'input-error' : ''}
  />
  {errors.team_name && (
    <span className="error-message">{errors.team_name}</span>
  )}
</div>
```

#### Fix 6: Update Form Actions
**Current:**
```javascript
<div className="form-actions">
  <button
    type="submit"
    className="btn btn-primary"
    disabled={!isFormValid}
  >
    {formMode === 'create' ? 'Create Team' : 'Update Team'}
  </button>
  {formMode === 'edit' && (
    <>
      <button
        type="button"
        onClick={resetTeamForm}
        className="btn btn-secondary"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleDeleteTeam}
        className="btn btn-delete btn-small"
      >
        Delete
      </button>
    </>
  )}
</div>
```

**Fixed:**
```javascript
const formHasErrors = hasErrors(errors);

<div className="form-actions">
  <button
    type="submit"
    className="btn btn-primary"
    disabled={formHasErrors || isCreating || isUpdating}
  >
    {isCreating || isUpdating ? (
      <>⏳ {editingTeam ? 'Updating...' : 'Creating...'}</>
    ) : (
      editingTeam ? '💾 Update Team' : '➕ Create Team'
    )}
  </button>
  {editingTeam && (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          setEditingTeam(null);
          resetForm();
        }}
        disabled={isUpdating}
      >
        ✕ Cancel
      </button>
      <button
        type="button"
        className="btn btn-small btn-delete"
        onClick={handleDeleteTeam}
        disabled={isDeleting}
        title="Delete team"
      >
        🗑️ Delete
      </button>
    </>
  )}
</div>
```

#### Fix 7: Update Edit/Delete Handlers
**Current:**
```javascript
const handleEditTeam = (team) => {
  setFormMode('edit');
  setEditingTeam(team);
  setTeamName(team.team_name);
  setOwnerNames((team.owners || []).join(', '));
};

const handleDeleteTeam = () => {
  if (window.confirm(`Are you sure you want to delete "${editingTeam.team_name}"?`)) {
    deleteTeam(editingTeam.team_name);
  }
};

const resetTeamForm = () => {
  setFormMode('create');
  setEditingTeam(null);
  setTeamName('');
  setOwnerNames('');
};
```

**Fixed:**
```javascript
const handleEditTeam = (team) => {
  setEditingTeam(team);
  setValues({
    team_name: team.team_name,
    owner_names: (team.owners || []).join(', '),
  });
};

const handleDeleteTeam = () => {
  if (window.confirm(`Are you sure you want to delete "${editingTeam.team_name}"? This action cannot be undone.`)) {
    deleteTeam(editingTeam.team_name);
  }
};
```

#### Fix 8: Add Back Link
**Add at bottom:**
```javascript
<Link to="/admin" className="back-link">← Back to Admin</Link>
```

#### Fix 9: Fix Form Header
**Update:**
```javascript
<h2>
  {editingTeam ? '✏️ Edit Fantasy Team' : '➕ Create Fantasy Team'}
</h2>
```

#### Fix 10: Update Mutations to Use Standard Pattern
```javascript
const { mutate: createTeam, isLoading: isCreating } = useMutation(
  (name, owners, season) =>
    neo4jService.createFantasyTeam(name, owners, season),
  () => {
    setSuccessMessage('Fantasy team created successfully!');
    resetForm();
    refetchTeams();
    setTimeout(() => setSuccessMessage(''), 3000);
  },
  (err) => {
    setErrorMessage(`Failed to create team: ${err.message}`);
    setTimeout(() => setErrorMessage(''), 3000);
  }
);

// Similar for update and delete
```

---

## PHASE 4: Comprehensive Summary of Changes

### Files to Modify:

#### 1. AllianceManager.js
- [x] Fix: `${editingId}` → `${editingId.alliance_name}` (1 line)
- [x] Add: Two useEffect hooks for loading players and alliances (30 lines)
- [x] Simplify: Error filtering logic (5 lines)
- [x] Fix: Alliance members display or remove (10 lines)
- [x] Fix: Status badge or remove (5 lines)

**Total changes:** ~50 lines

#### 2. DraftManager.js
- [x] Add: `import { Link }` (1 line)
- [x] Replace: Custom message system with standard pattern (20 lines)
- [x] Fix: Auto-increment logic to use teams.length (5 lines)
- [x] Add: Back link (1 line)
- [x] Consider: Adding useForm for validation (optional - may be complex given unique UI)

**Total changes:** ~30-50 lines (conservative approach without full useForm)

#### 3. FantasyTeamManager.js
- [x] Fix: CSS import from DraftManager to FantasyTeamManager (1 line)
- [x] Add: Link, useForm, validation imports (3 lines)
- [x] Replace: Manual form state with useForm hook (40 lines)
- [x] Replace: Custom validation with useForm validation (30 lines)
- [x] Replace: Custom message system (20 lines)
- [x] Add: Back link (1 line)
- [x] Update: Form rendering to use standard pattern (20 lines)
- [x] Fix: Form validity checking (5 lines)

**Total changes:** ~120 lines

---

## PHASE 5: Implementation Order & Priority

### Priority 1 (Quick Wins - 30 mins)
1. **AllianceManager** - Fix template literal bug (1 line)
2. **DraftManager** - Add Link import (1 line)
3. **DraftManager** - Add back link (1 line)
4. **FantasyTeamManager** - Fix CSS import (1 line)

### Priority 2 (Medium - 1-2 hours)
1. **AllianceManager** - Convert to useEffect pattern
2. **FantasyTeamManager** - Convert to useForm hook
3. **DraftManager** - Convert message system

### Priority 3 (Polish - 1 hour)
1. **AllianceManager** - Fix alliance members/status display
2. **FantasyTeamManager** - Update form rendering
3. **DraftManager** - Fix auto-increment logic

### Priority 4 (Optional - 30 mins)
1. **DraftManager** - Add useForm for validation (if needed)
2. Any styling adjustments

---

## TESTING CHECKLIST

After implementing fixes:

### AllianceManager Tests:
- [ ] Edit header shows correct alliance name
- [ ] Season change loads/unloads alliances correctly
- [ ] Form validation works
- [ ] Create alliance works
- [ ] Update alliance works
- [ ] Delete alliance works
- [ ] Search filters alliances
- [ ] Back link works

### DraftManager Tests:
- [ ] Can select season
- [ ] Team grid displays after season selection
- [ ] Can select player and create draft pick
- [ ] Auto-increment works correctly
- [ ] Pick count increases
- [ ] Delete draft pick works
- [ ] Messages display and auto-clear
- [ ] Back link works

### FantasyTeamManager Tests:
- [ ] CSS styling loads correctly
- [ ] Form validation works
- [ ] Create team works
- [ ] Edit team works
- [ ] Delete team works
- [ ] Owner names parse correctly
- [ ] Search filters teams
- [ ] Back link works
- [ ] All messages display correctly

