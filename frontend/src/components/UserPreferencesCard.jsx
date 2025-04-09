import { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, Typography, FormGroup, FormControlLabel, Checkbox, Button,
  Box, CircularProgress, Alert, Snackbar
} from '@mui/material';
import { fetchCategories, fetchUserProfile, updateUserPreferences } from '../api/apiService';

function UserPreferencesCard({ onSelectionChange, onSaveSuccess }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(new Set());
  const [initialSelectedIds, setInitialSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccessAlert, setSaveSuccessAlert] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [categoriesResponse, profileResponse] = await Promise.all([
        fetchCategories(),
        fetchUserProfile()
      ]);

      setCategories(categoriesResponse.data || []);

      const userSelectedIds = new Set(profileResponse.data?.interested_categories?.map(cat => cat.id) || []);
      setSelectedCategoryIds(userSelectedIds);
      setInitialSelectedIds(userSelectedIds);

       // --- Inform parent of initial selection ---
       if (onSelectionChange) {
        onSelectionChange(userSelectedIds);
    }

    } catch (err) {
      console.error("Failed to load preferences data:", err);
      setError("Failed to load categories or user preferences.");
    } finally {
      setLoading(false);
    }
  }, [onSelectionChange]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    const categoryId = parseInt(value, 10);

    // Create the new Set based on the change
    const newIds = new Set(selectedCategoryIds);
    if (checked) {
      newIds.add(categoryId);
    } else {
      newIds.delete(categoryId);
    }
    // Update local state
    setSelectedCategoryIds(newIds);

    // --- Inform parent of the change IMMEDIATELY ---
    if (onSelectionChange) {
      console.log("UserPreferencesCard: Checkbox changed, calling onSelectionChange");
      onSelectionChange(newIds);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError('');
    setSaveSuccessAlert(false);
    try {
      const idsToSave = Array.from(selectedCategoryIds);
      await updateUserPreferences(idsToSave);
      setInitialSelectedIds(selectedCategoryIds); // Update initial state
      setSaveSuccessAlert(true); // Show snackbar alert

      // --- Inform parent AFTER successful save ---
      if (onSaveSuccess) {
          onSaveSuccess(selectedCategoryIds); // Pass the saved set
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
      setError("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = initialSelectedIds.size !== selectedCategoryIds.size ||
                    ![...initialSelectedIds].every(id => selectedCategoryIds.has(id));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          User Preferences
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Event Categories
        </Typography>

        {loading && <CircularProgress size={24} sx={{ display: 'block', margin: 'auto' }} />}
        {error && !loading && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!loading && !error && (
          <FormGroup>
            {categories.length > 0 ? categories.map((category) => (
              <FormControlLabel
                key={category.id}
                control={
                  <Checkbox
                    checked={selectedCategoryIds.has(category.id)}
                    onChange={handleCheckboxChange}
                    value={category.id}
                  />
                }
                label={category.name}
              />
            )) : <Typography variant="body2">No categories available.</Typography>}
          </FormGroup>
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSaveChanges}
            disabled={loading || saving || !hasChanges}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </CardContent>
      <Snackbar
          open={saveSuccessAlert}
          autoHideDuration={4000}
          onClose={() => setSaveSuccessAlert(false)}
          message="Preferences saved successfully!"
      />
    </Card>
  );
}

export default UserPreferencesCard;