import {
    Box, Typography, Select, MenuItem, FormControl, InputLabel, IconButton, Toolbar
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const CalendarToolbar = ({ label, onNavigate }) => {
  return (
    <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: { xs: 1, md: 2 } }} disableGutters>
      <Box>
        <IconButton onClick={() => onNavigate('PREV')} aria-label="Previous Week">
          <NavigateBeforeIcon />
        </IconButton>
        <IconButton onClick={() => onNavigate('NEXT')} aria-label="Next Week">
          <NavigateNextIcon />
        </IconButton>
      </Box>
      <Typography variant="h6" component="span" sx={{ flexGrow: 1, textAlign: 'center' }}>
        {label}
      </Typography>
      {/* <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="category-filter-label">Category</InputLabel>
        <Select
          labelId="category-filter-label"
          id="category-filter"
          value={categoryFilter}
          label="Category"
          onChange={(e) => onCategoryFilterChange(e.target.value)}
        >
          <MenuItem value="">
              <em>All</em>
          </MenuItem>
          {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
          ))}
        </Select>
      </FormControl> */}
    </Toolbar>
  );
};

export default CalendarToolbar;