import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useRutterLink } from "react-rutter-link";
import axios from "axios";
import React from "react";
import { Button, Spinner, Table, Form } from "react-bootstrap";
import { Alert } from "react-bootstrap";

const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_RUTTER_PUBLIC_KEY || "RUTTER_PUBLIC_KEY";

export default function Home() {
  const [dataFetched, setDataFetched] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [accessToken, setAccessToken] = React.useState("");
  const [rutterConnected, setRutterConnected] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const config = {
    publicKey: PUBLIC_KEY,
    onSuccess: (publicToken) => {
      // We call our NextJS backend API in pages/api/rutter.js
      // It exchanges the publicToken for an access_token and makes an API call to /orders/get
      setLoading(true);
      axios
        // Calls handler method in pages/api/rutter.js
        .post("/api/rutter-exchange", {
          publicToken,
        })
        .then((response) => {
          const { data } = response;
          console.log(data);
          setAccessToken(data.accessToken);
          setRutterConnected(true);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          setLoading(false);
        });
    },
  };
  const { open, ready, error } = useRutterLink(config);

  const handleGenerateData = async () => {
    setLoading(true);
    try {
      const result = await axios.post("/api/rutter-generate", {
        accessToken: accessToken,
      });
      console.log(result);
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !rutterConnected) {
    return (
      <div>
        <Spinner animation="border"></Spinner>
      </div>
    );
  }

  if (rutterConnected) {
    // Show Endpoints and actions
    return (
      <div className={styles.main}>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <h1>Generate Sample Data</h1>
        <Button onClick={handleGenerateData}>Generate data now</Button>
        {loading && <Spinner animation="border"></Spinner>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Rutter Devtools</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to Seeding tool</h1>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
          className={styles.description}
        >
          <div></div>
          <Button style={{ marginTop: 4 }} onClick={() => open()}>
            Connect to your Store
          </Button>
        </div>
      </main>
    </div>
  );
}
