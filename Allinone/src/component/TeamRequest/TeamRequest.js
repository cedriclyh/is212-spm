import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import {VerticalDotsIcon} from "../Icons/VerticalDotsIcon";
import {SearchIcon} from "../Icons/SearchIcon";
import {ChevronDownIcon} from "../Icons/ChevronDownIcon";
import {columns, statusOptions} from "./TeamRequestData";
import {capitalize, formatDate, formatTimeslot} from "../TeamRequest/TeamRequestUtils";
import profilePic from "../Icons/profile_pic.png"

const statusColorMap = {
  Approved: "success",
  Rejected: "danger",
  Pending: "warning",
  Cancelled: "default",
  Withdrawn: "secondary",
};

const INITIAL_VISIBLE_COLUMNS = ["staff", "request_date", "arrangement_date", "timeslot", "status", "actions"];

var modalTitle = "Error Message";
var modalMsg = "";

export default function TeamRequest() {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [buttonColor, setButtonColor] = useState("danger");


  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [statusFilter, setStatusFilter] = React.useState(new Set(["Pending"]));
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "request_date",
    direction: "descending",
  });
  const [page, setPage] = React.useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const fetchRequests = async () => {
    try {
      const response = await fetch('http://get_request:5011/manager/140894/requests');
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data);
        
      } else if (response.status === 404) {
        setRequests([]);
      } else {
        console.error("An error occurred:", response.statusText);
        setRequests([]);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }; 

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredItems = React.useMemo(() => {
    let filteredRequests = [...requests];
  
    // Search by staff name
    if (hasSearchFilter) {
      filteredRequests = filteredRequests.filter((request) => {
        const staffFName = request.staff_details.staff_fname.toLowerCase();
        const staffLName = request.staff_details.staff_lname.toLowerCase();
        return staffFName.includes(filterValue.toLowerCase()) || staffLName.includes(filterValue.toLowerCase());
      });
    }
  
    if (statusFilter !== "all") {
      filteredRequests = filteredRequests.filter((request) => 
        statusFilter === "Pending" ? request.status === "Pending" : Array.from(statusFilter).includes(request.status)
      );
    }
  
    return filteredRequests;
  }, [filterValue, statusFilter, hasSearchFilter, requests]);

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
      const first = a[sortDescriptor.column] || '';
      const second = b[sortDescriptor.column] || '';
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const navigate = useNavigate();
  const handleViewClick = useCallback((requestId) => {
    navigate(`/requests/${requestId}`);
  }, [navigate]);

  const handleStatusChange = useCallback(async (currentRequestId, currentStatus) => {

    try {
      const response = await fetch(
        `http://manage_request:5010/manage_request`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            request_id: currentRequestId,
            status: currentStatus,
            remarks: ""
          })
        }
      );

      if (response.ok) {
        modalMsg = "Form processed successfully ";
        modalTitle = "Success!";
        setButtonColor("success");
        onOpen();
        setRequests((prevRequests) =>
            prevRequests.map((request) =>
                request.request_id === currentRequestId
                    ? { ...request, status: currentStatus }
                    : request
            )
        );
      }
      else {
        modalMsg = "Action Failed.";
        modalTitle = "Error Message";
        setButtonColor("danger");
        onOpen();
    }

    }
    catch(error){
      console.error("Error:", error);
        modalMsg = "An error occurred while approving/rejecting the request.";
        modalTitle = "Error Message";
        setButtonColor("danger");
        onOpen();
    }
  }, [onOpen]);

  const handleWithdrawChange = useCallback(async (requestId) => {

    try {
      const response = await fetch(
        `http://manage_request:5010/revoke_arrangments_by_request/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      if (response.ok) {
        modalMsg = "Action processed successfully ";
        modalTitle = "Success!";
        setButtonColor("success");
        onOpen();
        setRequests((prevRequests) =>
            prevRequests.map((request) =>
                request.request_id === requestId
                    ? { ...request, status: "Withdrawn" }
                    : request
            )
        );
      }
      else {
        modalMsg = "Action Failed.";
        modalTitle = "Error Message";
        setButtonColor("danger");
        onOpen();
    }
    }
    catch(error){
      console.error("Error:", error);
        modalMsg = "An error occurred while revoking the request.";
        modalTitle = "Error Message";
        setButtonColor("danger");
        onOpen();
    }
  }, [onOpen])

  const renderCell = useCallback((request, columnKey) => {
    const cellValue = request[columnKey];

    switch (columnKey) {
      case "staff":
        return (
          <User
            avatarProps={{radius: "lg", src: profilePic}}
            description={request.staff_details.email}
            name={request.staff_details.staff_fname + " " + request.staff_details.staff_lname}
          >
            {request.email}
          </User>
        );

        case "arrangement_date":
          if(request.is_recurring){
            return (
              <div>
                <p className="text-bold text-small" >{request.recurring_day}</p>
                <p className="text-bold text-tiny text-default-400">{formatDate(request.start_date)[1]} - {formatDate(request.end_date)[1]}</p>
              </div>
            )
          }
          else{
            return (
              <div>
                <p className="text-bold text-small" >{formatDate(request.arrangement_date)[0]}</p>
                <p className="text-bold text-tiny text-default-400">{formatDate(request.arrangement_date)[1]}</p>
                </div>
            );
          }
          case "timeslot":
            return (
              <div>
                <p className="text-bold text-small capitalize">{formatTimeslot(request.timeslot)[0]}</p>
                <p className="text-bold text-tiny capitalize text-default-400">{formatTimeslot(request.timeslot)[1]}</p>
              </div>
            )
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
                <DropdownItem onClick={() => handleViewClick(request.request_id)}>View</DropdownItem>
                {request.status === "Pending" && <DropdownItem
                  onClick={() => handleStatusChange(request.request_id, "Approved")}>Approve</DropdownItem>}
                {request.status === "Pending" && <DropdownItem
                  onClick={() => handleStatusChange(request.request_id, "Reject")}>Reject</DropdownItem>}
                {request.status === "Approved" && <DropdownItem
                 onClick={() => handleWithdrawChange(request.request_id)}>Withdraw</DropdownItem>}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      case "is_recurring":
        if (request.is_recurring){
          return (
            <div><i>YES</i></div>
          )
        }
        else{
          return (
            <div>NO</div>
          )
        }
      default:
        return cellValue;
    }
  }, [handleStatusChange, handleViewClick, handleWithdrawChange]);

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

  const onClear = React.useCallback(()=>{
    setFilterValue("")
    setPage(1)
  },[])

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold text-gray-900">Team Requests</p>
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by Staff's First or Last Name..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="sm:flex">
                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={(keys) => setStatusFilter(new Set(keys))}
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
                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
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
            <Button 
              color="primary" 
              // endContent={<PlusIcon />}
              href="/new_request"
              // as={Link}
              variant="solid">
              Revoke All Arrangements
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
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onPreviousPage}>
            Previous
          </Button>
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onNextPage}>
            Next
          </Button>
        </div>

        <Modal
          backdrop="opaque"
          isOpen={isOpen}
          onOpenChange={(isOpen) => {
            onOpenChange(isOpen);
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1" placement="top">
                  {modalTitle}
                </ModalHeader>
                <ModalBody>
                  <p>{modalMsg}</p>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color={buttonColor}
                    variant="light"
                    onPress={onClose}
                  >
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    );
  }, [selectedKeys, 
      page, 
      pages, 
      filteredItems.length, 
      onNextPage, 
      onPreviousPage,
      buttonColor,
      isOpen,
      onOpenChange,
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
      isLoading={isLoading}
      >
        {(item, rowIndex) => (
          <TableRow key={item.request_id}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey, rowIndex)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}