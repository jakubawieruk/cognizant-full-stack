import { useEffect, useState, useCallback, useMemo } from 'react';
import { Grid, Container} from '@mui/material';
import UserPreferencesCard from '../components/UserPreferencesCard';
import CalendarView from '../views/CalendarView';
import AppHeader from '../components/AppHeader';
import { fetchUserProfile } from '../api/apiService';

function MainLayout() {
  const [activeCategoryFilters, setActiveCategoryFilters] = useState(undefined);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);

  // Fetch initial user preferences to set the initial filter state
  const loadInitialPreferences = useCallback(async () => {
    setIsLoadingPrefs(true);
    try {
      const profileResponse = await fetchUserProfile();
      const initialIds = profileResponse.data?.interested_categories?.map(cat => cat.id) || [];
      console.log("MainLayout: Loaded initial preference IDs:", initialIds);
      setActiveCategoryFilters(initialIds);
    } catch (error) {
      console.error("MainLayout: Failed to load initial preferences", error);
      setActiveCategoryFilters([]); // Default to empty if loading fails
    } finally {
      setIsLoadingPrefs(false);
    }
  }, []);

  useEffect(() => {
    loadInitialPreferences();
  }, [loadInitialPreferences]);

  // Handler called by UserPreferencesCard when user CHECKS/UNCHECKS boxes
  const handleFilterChange = useCallback((newSelectedIdsSet) => {
    const newSelectedIdsArray = Array.from(newSelectedIdsSet);
    console.log("MainLayout: Filters changed (before save):", newSelectedIdsArray);
    setActiveCategoryFilters(newSelectedIdsArray);
  }, []);

  // Handler called by UserPreferencesCard AFTER successful save
  const handlePreferencesSaved = useCallback((savedIdsSet) => {
    const savedIdsArray = Array.from(savedIdsSet);
    console.log("MainLayout: Preferences successfully saved:", savedIdsArray);
  },[]);

  const categoryFilterKey = useMemo(() => {
    // Sort IDs to ensure order doesn't matter, then join into a string
    // Handle the initial undefined/null state
    if (!activeCategoryFilters) return 'loading';
    return [...activeCategoryFilters].sort((a, b) => a - b).join(',');
  }, [activeCategoryFilters]);

  console.log("MainLayout rendering. Filter Key:", categoryFilterKey);

  return (
    <>
      <AppHeader />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>

          {/* User Preferences Column */}
          <Grid size={{xs:12, md:3, lg:2}}>
            <UserPreferencesCard
              onSelectionChange={handleFilterChange}
              onSaveSuccess={handlePreferencesSaved}
            />
          </Grid>

          {/* Calendar Column */}
          <Grid size={{xs:12, md:9, lg:10}}>
            {/* Render Calendar only when initial prefs are loaded */}
            {isLoadingPrefs ? (
              <div>Loading Preferences for Calendar...</div> // Or a Spinner
            ) : (
              <CalendarView
                // Pass the array of active category IDs as a filter prop
                categoryFilterIds={activeCategoryFilters}
                categoryFilterKey={categoryFilterKey}
              />
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default MainLayout;