import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Checkbox,
  MenuItem,
  IconButton,
  Typography,
  Pagination,
  Select,
  InputLabel,
  OutlinedInput,
  FormControl,
  ListItemText
} from "@mui/material";
import { MoreVert as MoreVertIcon, Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import { columns, users, statusOptions } from "./data";
import { capitalize } from "./utils";
import Paper from '@mui/material/Paper';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const statusColorMap = {
  approved: "success",
  rejected: "error",
  pending: "warning",
};

const INITIAL_VISIBLE_COLUMNS = ["name", "role", "status", "actions"];

export default function App() {
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState([]); // Array to store selected keys
  const [visibleColumns, setVisibleColumns] = React.useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [statusFilter, setStatusFilter] = React.useState([]); 
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "age",
    direction: "ascending",
  });
  const [page, setPage] = React.useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...users];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (statusFilter.length && statusFilter.length !== statusOptions.length) {
      filteredUsers = filteredUsers.filter((user) =>
        statusFilter.includes(user.status)
      );
    }

    return filteredUsers;
  }, [users, filterValue, statusFilter, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback((user, columnKey) => {
    const cellValue = user[columnKey];

    switch (columnKey) {
      case "name":
        return (
          <div>
            <Typography variant="body1">{cellValue}</Typography>
            <Typography variant="body2" color="textSecondary">
              {user.email}
            </Typography>
          </div>
        );
      case "role":
        return (
          <div>
            <Typography variant="body2">{cellValue}</Typography>
            <Typography variant="caption" color="textSecondary">
              {user.team}
            </Typography>
          </div>
        );
      case "status":
        return (
          <Typography variant="body2" color={statusColorMap[user.status]}>
            {capitalize(cellValue)}
          </Typography>
        );
      case "actions":
        return (
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        );
      default:
        return cellValue;
    }
  }, []);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = users.map((user) => user.id);
      setSelectedKeys(newSelected);
      return;
    }
    setSelectedKeys([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selectedKeys.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedKeys, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedKeys.slice(1));
    } else if (selectedIndex === selectedKeys.length - 1) {
      newSelected = newSelected.concat(selectedKeys.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedKeys.slice(0, selectedIndex),
        selectedKeys.slice(selectedIndex + 1),
      );
    }

    setSelectedKeys(newSelected);
  };

  const isSelected = (id) => selectedKeys.indexOf(id) !== -1;

  const onRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  const onSearchChange = (e) => {
    setFilterValue(e.target.value);
    setPage(1);
  };

  const onClear = () => {
    setFilterValue("");
    setPage(1);
  };

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <TextField
            value={filterValue}
            onChange={onSearchChange}
            placeholder="Search by name..."
            variant="outlined"
            slotProps={{
              input: {
                startAdornment: <SearchIcon />,
                endAdornment: (
                  <IconButton onClick={onClear}>
                    <CloseIcon />
                  </IconButton>
                )}
            }}
          />

        <div style={{ display: "flex", gap: "1rem", minWidth: "200px" }}>
          <FormControl fullWidth variant="outlined" style={{ minWidth: 120 }}>
            <InputLabel id="multiple-checkbox-label" >Status</InputLabel>
            <Select
              labelId="multiple-checkbox-label"
              id="multiple-checkbox" 
              multiple
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              input={<OutlinedInput label="Tag" />}
              renderValue={(selected) => selected.join(', ')}
              MenuProps={MenuProps}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status.uid} value={status.name}>
                  <Checkbox checked={status.name} />
                  <ListItemText primary={status.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

        </div>
      </div>

  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
    <Typography variant="body2">Total {users.length} users</Typography>
    <FormControl variant="outlined" style={{ minWidth: 120 }}>
      <InputLabel>Rows per page</InputLabel>
      <Select value={rowsPerPage} onChange={onRowsPerPageChange}>
        <MenuItem value={5}>5</MenuItem>
        <MenuItem value={10}>10</MenuItem>
        <MenuItem value={15}>15</MenuItem>
      </Select>
    </FormControl>
  </div>
</div>

    );
  }, [filterValue, statusFilter, users.length, rowsPerPage]);

  const bottomContent = React.useMemo(() => {
    return (
      <div>
        <Typography variant="body2">
          {selectedKeys.length === users.length
            ? "All items selected"
            : `${selectedKeys.length} of ${filteredItems.length} selected`}
        </Typography>
        <Pagination
          count={pages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </div>
    );
  }, [selectedKeys, items.length, page, pages]);

  return (
    <div>
      {topContent}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedKeys.length > 0 && selectedKeys.length < users.length}
                  checked={users.length > 0 && selectedKeys.length === users.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              {headerColumns.map((column) => (
                <TableCell key={column.uid}>{column.name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedItems.map((item) => {
              const isItemSelected = isSelected(item.id);
              return (
                <TableRow
                  key={item.id}
                  hover
                  onClick={(event) => handleClick(event, item.id)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  selected={isItemSelected}
                >
                  <TableCell padding="checkbox">
                    <Checkbox checked={isItemSelected} />
                  </TableCell>
                  {headerColumns.map((column) => (
                    <TableCell key={column.uid}>{renderCell(item, column.uid)}</TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {bottomContent}
    </div>
  );
}
