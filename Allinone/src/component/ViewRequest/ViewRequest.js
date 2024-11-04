import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Chip,
    User,
    Spinner,
} from "@nextui-org/react";
import profilePic from "../Icons/profile_pic.png";
import {VerticalDotsIcon} from "../Icons/VerticalDotsIcon";
import { formatTimeslot } from "../RequestPage/RequestPageUtils";

const statusColorMap = {
    Approved: "success",
    Rejected: "danger",
    Pending: "warning",
    Cancelled: "default",
    Withdrawn: "secondary",
};

export default function ViewRequest() {
    const { uid } = useParams();
    const [requestData, setRequestData] = useState(null);
    const [dates, setDates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleColumns, setVisibleColumns] = useState(["arrangment_date"])

    // const isWithinTwoWeeks = useCallback((arrangementDate) => {
    //     const now = new Date();
    //     const arrangement = new Date(arrangementDate);
    //     const twoWeeksBefore = new Date(arrangement);
    //     twoWeeksBefore.setDate(arrangement.getDate() - 14);
    //     const twoWeeksAfter = new Date(arrangement);
    //     twoWeeksAfter.setDate(arrangement.getDate() + 14);
    
    //     return now >= twoWeeksBefore && now <= twoWeeksAfter;
    // }, []);

    useEffect(() => {
        const fetchRequestData = async () => {
            try {
                const response = await fetch(`http://localhost:5011/view_request/${uid}`);
                if (response.ok) {
                    const data = await response.json();
                    setRequestData(data.data);
                    
                    if (data.data.is_recurring) {
                        setDates(data.data.arrangement_dates || []);
                    } else {
                        setDates(data.data.arrangement_date ? [data.data.arrangement_date] : []);
                    }
                } else {
                    console.error("Failed to fetch request data");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRequestData();
    }, [uid]);

    // const renderCell = React.useCallback((visibleColumns, columnKey) => {
    //     const cellValue = requestData[columnKey]

    //     switch (columnKey) {
    //         case "actions":
    //             return (
    //                 <Dropdown>
    //                     <DropdownTrigger>
    //                         <Button isIconOnly size="sm" variant="light">
    //                         <VerticalDotsIcon className="text-default-300" />
    //                         </Button>
    //                     </DropdownTrigger>
    //                     <DropdownMenu>
    //                         <DropdownItem>Cancel</DropdownItem>
    //                     </DropdownMenu>
    //                 </Dropdown>
    //             );
            
    //         case "status": 
    //             return (
    //                 <Chip color={statusColorMap[requestData.status]} size="sm" variant="flat">
    //                     {cellValue}
    //                 </Chip>
    //             )
            
    //     }
    // })
    
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                textAlign: 'center'
            }}>
                <Spinner />
            </div>
        );
    }

    if (!requestData) {
        return <div>No request data found</div>;
    }

    return (
        <div className="space-y-6 bg-white border border-gray-300 shadow-lg p-6" style={{ padding: "10px 20px", borderRadius: "10px" }}>
            <div className="my-2">
                <h2 className="text-lg font-semibold text-gray-900">Request {uid}</h2>
            </div>

            <div style={{ marginTop: "20px" }}>
                <p style={{ marginBottom: "10px" }}>Reviewer:</p>
                <User
                    className="my-2"
                    avatarProps={{ radius: "lg", src: profilePic }}
                    description={requestData.manager_details.email}
                    name={`${requestData.manager_details.staff_fname} ${requestData.manager_details.staff_lname}`}
                >
                    {requestData.manager_details.email}
                </User>
            </div>

            <div style={{ marginTop: "20px" }}>
                <p style={{ marginBottom: "10px" }}>Requestee:</p>
                <User
                    className="my-2"
                    avatarProps={{ radius: "lg", src: profilePic }}
                    description={requestData.staff_details.email}
                    name={`${requestData.staff_details.staff_fname} ${requestData.staff_details.staff_lname}`}
                >
                    {requestData.staff_details.email}
                </User>
            </div>

            <div style={{ marginTop: "20px" }}>
                <p>Requested On:</p>
                <p className="text-bold text-small capitalize">{requestData.request_date}</p>
            </div>

            <div style={{ marginTop: "20px" }}>
                <p style={{ marginBottom: "10px" }}>Status:</p>
                <Chip color={statusColorMap[requestData.status]} size="sm" variant="flat">
                    {requestData.status}
                </Chip>
            </div>

            <div style={{ marginTop: "20px" }}>
                <p>Timeslot:</p>
                <div>
                    <div>
                        <p className="text-bold text-small capitalize">
                            {formatTimeslot(requestData.timeslot)[0]}, {formatTimeslot(requestData.timeslot)[1]}
                        </p>
                    </div>
                </div>
            </div>

            {requestData.is_recurring && (
                <div style={{ marginTop: "20px" }}>
                    <p style={{ marginBottom: "10px" }}>Recurring Weekday:</p>
                    <div>
                        <p className="text-bold text-small capitalize">
                            {requestData.recurring_day || "N/A"}
                        </p>
                    </div>
                </div>
            )}

            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <Table aria-label="Arrangement dates table" isCompact>
                <TableHeader>
                    <TableColumn>ARRANGEMENT DATES (YYYY-MM-DD)</TableColumn>
                </TableHeader>
                <TableBody>
                        {dates.map((date, index) => (
                            <TableRow key={index}>
                                <TableCell>{date}</TableCell>
                            </TableRow>
                        ))
                        }
                </TableBody>
            </Table>

            {requestData.status === "Approved" && (
                <Table aria-label="Arrangement dates table" isCompact>
                <TableHeader>
                    <TableColumn>ARRANGEMENT DATES (YYYY-MM-DD)</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                        {dates.map((date, index) => (
                            <TableRow key={index}>
                                <TableCell>{date}</TableCell>
                            </TableRow>
                        ))
                        }
                </TableBody>
            </Table>
            )}
            </div>
        </div>
    );
}
