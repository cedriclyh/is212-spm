import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NewRequest from '../NewRequestPage/NewRequest';

const EditRequestPage = () => {
  const { uid } = useParams();
  const [requestData, setRequestData] = useState(null);
  
  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        const response = await fetch(`http://localhost:5003/get_request/${uid}`);
        console.log(response);
        if (response.ok) {
          const data = await response.json();
          setRequestData(data.data);
          console.log(data.data)
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
    <NewRequest initialFormData={requestData} />
  ) : (
    <p>Loading...</p>
  );
};

export default EditRequestPage;