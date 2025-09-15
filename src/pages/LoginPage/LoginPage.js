import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";
import axios from "axios";
import CustomButton from "../../components/CustomButton/CustomButton";
import { setTokens } from "../../services/api";

const LoginPage = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/v1/auth/sign-in`,
        { id, password },
        { withCredentials: true }
      );
      const accessToken = data?.accessToken || data?.access_token || "";
      const refreshToken = data?.refreshToken || data?.refresh_token || "";
      setTokens({ accessToken, refreshToken });
      navigate("/");
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) alert("유저를 찾을 수 없습니다.");
        else if (status === 401) alert("비밀번호가 일치하지 않습니다.");
        else if (status === 400 && data && data.message) alert(data.message);
        else alert("로그인에 실패했습니다. 다시 시도해주세요.");
      } else {
        alert("네트워크 오류가 발생했습니다.");
      }
    }
  };

  const handleSignup = () => navigate("/signup");

  return (
    <div className={styles.loginPageContainer}>
      <img src="/image/logo.png" alt="PRAVELL 로고" className={styles.logo} />
      <form onSubmit={handleLogin} className={styles.loginForm}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>아이디</label>
          <input
            type="text"
            placeholder="아이디를 입력해 주세요"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className={styles.inputField}
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>비밀번호</label>
          <input
            type="password"
            placeholder="비밀번호를 입력해 주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.inputField}
          />
        </div>
        <CustomButton
          text="로그인"
          onClick={handleLogin}
          style={{
            width: "100%",
            height: "50px",
            marginTop: "20px",
            backgroundColor: "var(--primary-color)",
            color: "var(--text-primary)",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "700",
          }}
        />
      </form>
      <button onClick={handleSignup} className={styles.signupButton}>
        회원가입
      </button>
    </div>
  );
};

export default LoginPage;
