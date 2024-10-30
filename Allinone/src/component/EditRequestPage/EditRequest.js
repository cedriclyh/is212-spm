import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NewRequest from '../NewRequestPage/NewRequest';

const EditRequestPage = () => {
  const { uid } = useParams();
  const [requestData, setRequestData] = useState(null);

  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        const response = await fetch(`http://localhost:5004/request/${uid}`);
        if (response.ok) {
          const data = await response.json();
          setRequestData(data);
        } else {
          console.error("Failed to fetch request data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchRequestData();
  }, [uid]);

  return requestData ? (
    <NewRequest requestData={requestData} />
  ) : (
    <p>Loading...</p>
  );
};

export default EditRequestPage;
