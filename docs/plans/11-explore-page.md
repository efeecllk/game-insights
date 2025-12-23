# F011 - Explore Page

**Status:** 📋 Planned  
**Priority:** Medium  
**Effort:** Large

## Overview
Query builder for custom data exploration.

## Features
- [ ] Visual query builder
- [ ] Date range picker
- [ ] Metric selection
- [ ] Dimension grouping
- [ ] Data export (CSV, JSON)
- [ ] Save queries

## UI Components
- Dropdown for metrics
- Multi-select for dimensions
- Date range calendar
- Result table with sorting
- Export buttons

## SQL Generation
```sql
SELECT dimension, SUM(metric)
FROM events
WHERE date BETWEEN start AND end
GROUP BY dimension
ORDER BY SUM(metric) DESC
```
