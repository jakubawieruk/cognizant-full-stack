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
    setCategories([]);
    setSelectedCategoryIds(new Set());
    setInitialSelectedIds(new Set());
    try {
      const results = await Promise.allSettled([
          fetchCategories(),
          fetchUserProfile()
      ]);

      console.log("API Fetch Results:", results);

      const categoriesResult = results[0];
      const profileResult = results[1];

      // Process Categories Result
      if (categoriesResult.status === 'fulfilled' && categoriesResult.value?.data) {
          const categoryData = categoriesResult.value.data;
          console.log("[TEST DEBUG] Categories Response Data:", categoryData);
          if (Array.isArray(categoryData)) {
              setCategories(categoryData);
          } else {
              console.warn("Received non-array data for categories:", categoryData);
              setError(prev => prev ? prev + " / Invalid category data" : "Invalid category data");
          }
      } else {
          console.error("Failed to fetch categories:", categoriesResult.reason || "Unknown error");
          setError(prev => prev ? prev + " / Failed to load categories" : "Failed to load categories");
      }

      // Process Profile Result (and inform parent of initial selection)
      let initialSelection = new Set(); // Use appropriate type if using TS
      if (profileResult.status === 'fulfilled' && profileResult.value?.data) {
        const profileData = profileResult.value.data;
        console.log("[TEST DEBUG] Profile Response Data:", profileData);
        const userSelectedIds = new Set(profileData?.interested_categories?.map(cat => cat.id) || []);
        setSelectedCategoryIds(userSelectedIds);
        setInitialSelectedIds(userSelectedIds);
        initialSelection = userSelectedIds; // Store for callback
      } else {
        console.error("Failed to fetch user profile:", profileResult.reason || "Unknown error");
        setError(prev => prev ? prev + " / Failed to load user preferences" : "Failed to load user preferences");
        // Keep selections empty if profile fails
        setSelectedCategoryIds(new Set());
        setInitialSelectedIds(new Set());
      }

      // Inform parent of initial selection (even if empty or partially loaded)
      if (onSelectionChange) {
        onSelectionChange(initialSelection);
      }

  } catch (err) {
    // Catch potential errors *outside* Promise.allSettled (less likely now)
    console.error("Unexpected error in loadData:", err);
    setError("An unexpected error occurred while loading data.");
    setCategories([]); // Reset on unexpected error
    setSelectedCategoryIds(new Set());
    setInitialSelectedIds(new Set());
  } finally {
    setLoading(false);
  }
// Ensure dependencies are correct
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