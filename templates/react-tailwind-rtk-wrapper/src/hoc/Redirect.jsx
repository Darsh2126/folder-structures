// This component will redirect you to role based Component if token is already available
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const Redirect = ({ ComposedComponent }) => {
  const token = ''; // get Token from utils
  const [content, setContent] = useState(null);

  useEffect(() => {

    if (token) {
      setContent(<Navigate to={'/'} />) // desired location
    } else {
      setContent(ComposedComponent)
    }

  }, [token, ComposedComponent]);
  return content

};

export default Redirect;