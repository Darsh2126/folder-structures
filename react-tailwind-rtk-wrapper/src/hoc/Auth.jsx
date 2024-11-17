import { Navigate } from "react-router-dom";


const Auth = (ComposedComponent) => {
  const AuthWrapper = () => {
    const token = ''; // token from localstorage or from BE

    let content;

    if (token) {
      content = (
        <ComposedComponent />
      )
    } else {
      content = (<Navigate to='/login' />)
    }
    return content;
  }
  return AuthWrapper;
};

export default Auth;