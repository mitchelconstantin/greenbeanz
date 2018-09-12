import React from 'react';
import LoginForm from './LogInForm.jsx';

const Home = (props) => {
  return (
    <div id="home">
      <div className="divider"></div>
      <div className="loginContainer">
        <h1 className="welcome">Welcome to <em style={{ color: '#7bc57d' }}>The Green Bean</em> <img src="GB-blue.png" alt="logo" className="loginLogo" /> </h1>
        <LoginForm handleLogin={props.handleLogin} updateInfo={props.updateInfo} error={props.error} errMsg={props.errMsg} />
      </div>
    </div>
  );
};

export default Home;