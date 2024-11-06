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
    Chip,
    User,
    Spinner,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Input,
    Link,
} from "@nextui-org/react";
import profilePic from "../Icons/profile_pic.png";
import { formatTimeslot } from "../RequestPage/RequestPageUtils";

const statusColorMap = {
    Approved: "success",
    Rejected: "danger",
    Pending: "warning",
    Cancelled: "default",
    Withdrawn: "secondary",
};

var modalTitle = "Error Message";
var modalMsg = "";

export default function ViewRequest() {
    const { uid } = useParams();
    const [requestData, setRequestData] = useState(null);
    const [dates, setDates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [arrangements, setArrangements] = useState([]);

    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const { isOpen: isOpenReason, onOpen: onOpenReason, onOpenChange: onOpenChangeReason } = useDisclosure();
    const [buttonColor, setButtonColor] = useState("danger");
    const [remarks, setRemarks] = useState("");
    const [currentRequestId, setCurrentRequestId] = useState(null);
  

    const handleWithdrawArrangement = useCallback(async (arrangementId) => {
        if (!remarks) {
            modalMsg = "Cancellation reason is required.";
            modalTitle = "Error Message";
            setButtonColor("danger");
            onOpen(); 
            return;
          }
        
        const arrangement = arrangements.find(a => a.arrangement_id === arrangementId);
        if (!arrangement) {
            modalTitle = "Error Message";
            modalMsg = "Arrangement not found.";
            onOpen()
            return;
        }

        const currentDate = new Date();
        const arrangementDate = new Date(arrangement.arrangement_date);
        const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;

        if (Math.abs(arrangementDate - currentDate) > twoWeeksInMs) {
            modalTitle = "Error Message";
            modalMsg = "You can only withdraw arrangements within two weeks of the arrangement date.";
            onOpen()
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:5005/withdraw_arrangement/${uid}/${arrangementId}`, {
                method: 'DELETE',
            });
    
            if (response.ok) {
                setArrangements(arrangements.filter(a => a.arrangement_id !== arrangementId));
                setRequestData(prevData => ({
                    ...prevData,
                    status: "Withdrawn",
                }));
                // Make a call to update the status in the database
                const statusResponse = await fetch(`http://localhost:5003/update_request/${uid}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: "Withdrawn" }),
                });

                if (!statusResponse.ok) {
                    modalMsg = "Form processed successfully ";
                    modalTitle = "Error updating request status:" + statusResponse.status;
                    setButtonColor("success");
                    onOpen();
                }

                modalTitle = "Success!";
                modalMsg = "Withdrawal Sucessful!";
                setButtonColor("success");
                onOpen();

            } else {
                console.error('Error deleting arrangement:', response.status);
            }
        } catch (error) {
            modalMsg = "Error deleting arrangement.";
            modalTitle = "Error Message";
            setButtonColor("danger");
            onOpen();
            console.error('Error deleting arrangement:', error);
        }
    }, [onOpen, remarks, arrangements, uid]);

    const withdrawArrangement_approved = useCallback((arrangement_id) => {
        setRemarks(""); 
        setCurrentRequestId(arrangement_id);
        onOpenReason(); 
      }, [onOpenReason]);
    
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

    useEffect(() => {
        async function fetchArrangementDates() {
            try {
                const response = await fetch(
                    `http://localhost:5005/get_arrangements/request/${uid}`
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const output = await response.json();
                setArrangements(output.data);
            } catch (error) {
                console.error("Error fetching arrangement dates:", error);
                setArrangements([]);
            }
        }
    
        if (requestData?.status === "Approved") {
            fetchArrangementDates();
        }
    }, [requestData?.status, uid]);

    
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
            <p>
                <Link href="/requests" underline="hover">Back to Request Page</Link>
            </p>
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
                {requestData.status === "Approved" && (
                    <Table aria-label="Arrangement dates table" isCompact>
                        <TableHeader>
                            <TableColumn>ARRANGEMENT DATES (YYYY-MM-DD)</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {dates.map((date, index) => {
                                // Find if the date is an arrangement date
                                const arrangement = arrangements.find(arr => arr.arrangement_date === date);

                                return (
                                    <TableRow key={index}>
                                        <TableCell>{date}</TableCell>
                                        {arrangement ? (
                                            <TableCell>
                                                <Chip color="success" size="sm" variant="flat">Approved</Chip>
                                            </TableCell>
                                        ) : (
                                            <TableCell>
                                                <Chip color="default" size="sm" variant="flat">-</Chip>
                                            </TableCell>
                                        )}
                                        {arrangement ? (
                                            <TableCell>
                                                <Button color="danger" size="sm" variant="flat" 
                                                    onClick={() => withdrawArrangement_approved(arrangement.arrangement_id)}
                                                >
                                                    Withdraw
                                                </Button>
                                            </TableCell>
                                        ) : (
                                            <TableCell>-</TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
                {requestData.status !== "Approved" && (
                    <Table aria-label="Arrangement dates table" isCompact>
                        <TableHeader>
                            <TableColumn>ARRANGEMENT DATES (YYYY-MM-DD)</TableColumn>
                            
                        </TableHeader>
                        <TableBody>
                            {dates.map((arrangement, index) => (
                                <TableRow key={index}>
                                    <TableCell>{arrangement}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* basic modal */}
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

            {/* input reason modal */}
            <Modal
            backdrop="opaque"
            isOpen={isOpenReason}
            onOpenChange={onOpenChangeReason}
            >
            <ModalContent>
                {(onClose) => (
                <>
                <ModalHeader className="flex flex-col gap-1">Input Reason</ModalHeader>
                <ModalBody>
                    <Input
                        autoFocus
                        label="Cancel Reason"
                        placeholder="Enter your reason"
                        variant="bordered"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        />
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                    Close
                    </Button>
                    <Button color="primary" variant="light" onPress={ () => {
                    onClose();
                    handleWithdrawArrangement(currentRequestId);
                    }}>
                    Confirm
                    </Button>
                </ModalFooter>
                </>
                )}
            </ModalContent>

            </Modal>
        </div>
    );
}