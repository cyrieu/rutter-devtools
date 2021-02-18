import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useRutterLink } from "react-rutter-link";
import axios from "axios";
import React from "react";
import { Button, Spinner, Table, Form } from "react-bootstrap";
import { Alert, OverlayTrigger, Tooltip } from "react-bootstrap";
import qs from "qs";
import { useRouter } from "next/router";

const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_RUTTER_PUBLIC_KEY || "RUTTER_PUBLIC_KEY";

export default function Home() {
  const [dataFetched, setDataFetched] = React.useState(null);
  const [connectLoading, setConnectLoading] = React.useState(false);
  const [dataLoading, setDataLoading] = React.useState(false);
  const [accessToken, setAccessToken] = React.useState("");
  const [rutterConnected, setRutterConnected] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [dataErrorMessage, setDataErrorMessage] = React.useState("");
  const [generatedData, setGeneratedData] = React.useState(null);
  const router = useRouter();
  const { query } = router;

  const handleExchangeToken = async (publicToken) => {
    setConnectLoading(true);
    return (
      axios
        // Calls handler method in pages/api/rutter.js
        .post("/api/rutter-exchange", {
          publicToken,
        })
        .then((response) => {
          const { data } = response;
          setAccessToken(data.accessToken);
          setRutterConnected(true);
          localStorage.setItem("rutteraccesstoken", data.accessToken);
        })
        .catch((e) => {
          setErrorMessage(e?.response?.data?.error);
        })
        .finally(() => {
          setConnectLoading(false);
        })
    );
  };

  const handleDisconnect = () => {
    localStorage.clear();
    setRutterConnected(false);
  };

  React.useEffect(() => {
    // see if we have any credentials from somewhere
    console.log(query.public_token);
    if (query.public_token) {
      // skip connect
      handleExchangeToken(query.public_token);
    }
  }, [query]);

  React.useEffect(() => {
    console.log(window.localStorage);
    if (window.localStorage) {
      const rutterAccessToken = localStorage.getItem("rutteraccesstoken");
      if (rutterAccessToken) {
        setRutterConnected(true);
        setAccessToken(rutterAccessToken);
      }
    }
  }, []);

  const config = {
    publicKey: PUBLIC_KEY,
    onSuccess: (publicToken) => {
      // We call our NextJS backend API in pages/api/rutter.js
      // It exchanges the publicToken for an access_token and makes an API call to /orders/get
      handleExchangeToken(publicToken);
    },
  };
  const { open, ready, error } = useRutterLink(config);

  const handleGenerateSeed = async () => {
    setDataLoading(true);
    try {
      const result = await axios.post("/api/rutter-simple-seed", {
        accessToken: accessToken,
      });
      const { data } = result;
      setGeneratedData(data);
    } catch (e) {
      console.error(e);
      if (e.response) {
        if (e.response?.data?.error) {
          setDataErrorMessage(e.response.data.error);
        } else {
          setDataErrorMessage(
            "Oops, something unexpected happened. Please try again, or contact support@rutterapi.com"
          );
        }
      } else {
        setDataErrorMessage(
          "Oops, something unexpected happened. Please try again, or contact support@rutterapi.com"
        );
      }
    } finally {
      setDataLoading(false);
    }
  };

  const handleGenerateProducts = async () => {
    setDataLoading(true);
    try {
      const result = await axios.post("/api/rutter-generate-products", {
        accessToken: accessToken,
      });
      const {
        data: { products },
      } = result;
      setGeneratedData(products);
    } catch (e) {
      console.error(e);
      setDataErrorMessage(e.message);
    } finally {
      setDataLoading(false);
    }
  };

  const handleGenerateOrders = async (useExistingProducts) => {
    setDataLoading(true);
    try {
      const result = await axios.post("/api/rutter-generate-orders", {
        accessToken: accessToken,
        useExistingProducts,
      });
      const {
        data: { orders },
      } = result;
      setGeneratedData(orders);
    } catch (e) {
      console.error(e);
      setDataErrorMessage(e.message);
    } finally {
      setDataLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Rutter Devtools</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>Rutter Devtools</h1>
        <div className={styles.subtitle}>
          Rutter has open-sourced some utilities that help Ecommerce developers
          build faster. You can quickly seed a test Ecommerce store with
          realistic products & orders data.{" "}
          <b>
            Note: This app is meant to be used with development stores only.
          </b>
        </div>
        <div style={{ marginTop: 4 }}>
          <a href="https://github.com/cyrieu/rutter-devtools" target="_blank">
            View this app's source code here.
          </a>
        </div>
        <div style={{ marginTop: 4 }}>
          If you have questions, don't hesitate to email us at{" "}
          <a href="mailto:hello@rutterapi.com">hello@rutterapi.com</a>
        </div>
        <hr />
        <div>
          <div style={{ fontWeight: 500, fontSize: "1.5rem" }}>
            Connect your Ecommerce store
          </div>
          {errorMessage && (
            <Alert style={{ marginTop: 4 }} variant="danger">
              {errorMessage}
            </Alert>
          )}
          {rutterConnected ? (
            <>
              <Alert style={{ marginTop: 4 }} variant="success">
                Store connected.
              </Alert>
              <Button onClick={handleDisconnect}>
                Connect to a different store
              </Button>
            </>
          ) : (
            <Button
              disabled={connectLoading}
              variant="success"
              size="sm"
              style={{ marginTop: 8 }}
              onClick={() => open()}
            >
              {connectLoading ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>
        {rutterConnected && (
          <div>
            <hr />
            <div style={{ fontWeight: 500, fontSize: "1.5rem" }}>
              Generate Test Data
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", marginTop: 4 }}>
              <OverlayTrigger
                key={"top"}
                placement="top"
                overlay={
                  <Tooltip>
                    This will create 10 products & 10 orders using the created
                    products. Some fields are left null intentionally to help
                    you test edge-cases.
                  </Tooltip>
                }
              >
                <Button
                  size="sm"
                  style={{ marginRight: 4 }}
                  onClick={() => handleGenerateSeed()}
                  disabled={dataLoading}
                >
                  Generate Simple Seed Dataset
                </Button>
              </OverlayTrigger>
              <Button
                size="sm"
                style={{ marginRight: 4 }}
                onClick={handleGenerateProducts}
                disabled={dataLoading}
              >
                Generate 10 Test Products
              </Button>
              <Button
                size="sm"
                style={{ marginRight: 4 }}
                onClick={() => handleGenerateOrders(true)}
                disabled={dataLoading}
              >
                Generate 10 Test Orders
              </Button>
            </div>
            {/* <div style={{ marginTop: 8 }}>
              <Button size="sm" variant="danger">
                Delete Generated Data
              </Button>
            </div> */}
          </div>
        )}
        {(dataLoading || generatedData) && (
          <div>
            <hr />
            <div style={{ fontWeight: 500, fontSize: "1.5rem" }}>
              Generated Data JSON
            </div>
            {dataLoading ? (
              <Spinner animation="border"></Spinner>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", marginTop: 4 }}>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={JSON.stringify(generatedData, null, 4)}
                />
              </div>
            )}
          </div>
        )}
        {dataErrorMessage && (
          <Alert style={{ marginTop: 8 }} variant="danger">
            {dataErrorMessage}
          </Alert>
        )}
      </main>
    </div>
  );
}
