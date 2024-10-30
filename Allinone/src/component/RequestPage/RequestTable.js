import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
  Spinner,
} from "@nextui-org/react";
import { PlusIcon } from "../Icons/PlusIcon";
import { VerticalDotsIcon } from "../Icons/VerticalDotsIcon";
import { SearchIcon } from "../Icons/SearchIcon";
import { ChevronDownIcon } from "../Icons/ChevronDownIcon";
import { columns, statusOptions, pulled_data } from "./RequestData";
import { capitalize, formatDate, formatTimeslot } from "./RequestPageUtils";
import profilePic from "../Icons/profile_pic.png"

const statusColorMap = {
  Approved: "success",
  Rejected: "danger",
  Pending: "warning",
  Cancelled: "default",
  Withdrawn: "secondary",
};

const INITIAL_VISIBLE_COLUMNS = [
  "arrangement_date",
  "timeslot",
  "manager",
  "status",
  "actions",
];

export default function RequestTable() {
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "request_date",
    direction: "descending",
  });
  const [page, setPage] = React.useState(1);
  const [requests, setRequests] = React.useState(pulled_data);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredRequests = [...pulled_data];

    // Search by arrangement_date
    if (hasSearchFilter) {
      filteredRequests = filteredRequests.filter((request) => {
        const formattedDate = formatDate(request.arrangement_date).join(" "); // Format the arrangement date
        return formattedDate.toLowerCase().includes(filterValue.toLowerCase()); // Search by formatted date
      });
    }

    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredRequests = filteredRequests.filter((request) =>
        Array.from(statusFilter).includes(request.status)
      );
    }

    return filteredRequests;
  }, [filterValue, statusFilter, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const pageNumber = Number(page);
  const rowsPerPageNumber = Number(rowsPerPage);

  const items = React.useMemo(() => {
    const start = (pageNumber - 1) * rowsPerPageNumber;
    const end = start + rowsPerPageNumber;
    return filteredItems.slice(start, end);
  }, [pageNumber, filteredItems, rowsPerPageNumber]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column] || "";
      const second = b[sortDescriptor.column] || "";
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const cancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) {
      return; // User withdraw the action
    }
    try {
      const response = await fetch(
        `http://localhost:5010/cancel_request/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "Cancel" }),
        }
      );

      if (response.ok) {
        alert("Request successfully cancelled.");
        // Refresh the request data to reflect the updated status
        setRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.request_id === requestId
              ? { ...request, status: "Cancelled" }
              : request
          )
        );
      } else {
        const result = await response.json();
        alert(result.message || "Failed to cancel request.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while cancelling the request.");
    }
  };

  const renderCell = React.useCallback((request, columnKey) => {
    const cellValue = request[columnKey];

    switch (columnKey) {
        case "arrangement_date":
          return (
            <div>
              <p className="text-bold text-small" >{formatDate(request.arrangement_date)[0]}</p>
              <p className="text-bold text-tiny text-default-400">{formatDate(request.arrangement_date)[1]}</p>
              </div>
          );
        case "staff":
          return (
            <User
              avatarProps={{radius: "lg", src: profilePic}}
              description={request.manager_details.email}
              name={request.manager_details.staff_fname + " " + request.manager_details.staff_lname}
            >
              {request.email}
            </User>
          );
        case "timeslot":
          return (
            <div>
              <p>{formatTimeslot(request.timeslot)[1]}</p>
            </div>
          )
        case "manager":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">
              {request.manager_details.staff_fname +
                " " +
                request.manager_details.staff_lname}
            </p>
            <p className="text-bold text-tiny capitalize text-default-400">
              {request.manager_details.email}
            </p>
          </div>
        );
      case "status":
        return (
          <Chip color={statusColorMap[request.status]} size="sm" variant="flat">
            {capitalize(cellValue)}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <VerticalDotsIcon className="text-default-300" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem>View</DropdownItem>
                {request.status === "Pending" && (
                  <DropdownItem>Edit</DropdownItem>
                )}
                {request.status === "Pending" && (
                  <DropdownItem
                    onClick={() => cancelRequest(request.request_id)}
                  >
                    Cancel
                  </DropdownItem>
                )}
                {request.status === "Approved" && (
                  <DropdownItem
                    onClick={() => cancelRequest(request.request_id)}
                  >
                    Cancel
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = React.useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = React.useCallback((value) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold text-gray-900">My Requests</p>
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by arrangement date..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                >
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button color="primary" endContent={<PlusIcon />}>
              <a href="/new_request">Add New</a>
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">Total {filteredItems.length} Requests</span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    onRowsPerPageChange,
    onSearchChange,
    onClear,
    filteredItems.length,
  ]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [
    selectedKeys,
    page,
    pages,
    filteredItems.length,
    onNextPage,
    onPreviousPage,
  ]);

  return (
    <Table
      aria-label="Example table with custom cells, pagination and sorting"
      isHeaderSticky
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[382px]",
      }}
      selectedKeys={selectedKeys}
      selectionMode="multiple"
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSelectionChange={setSelectedKeys}
      onSortChange={setSortDescriptor}
    >
      <TableHeader columns={headerColumns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        emptyContent={"No Requests found"}
        items={sortedItems}
        loadingContent={<Spinner label="Loading..." />}
      >
        {(item, rowIndex) => (
          <TableRow key={item.request_id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey, rowIndex)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
