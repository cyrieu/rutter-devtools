import axios from "axios";

const ENV_URL = process.env.RUTTER_URL || "sandbox.rutterapi.com";
const CLIENT_ID = process.env.RUTTER_CLIENT_ID || "RUTTER_CLIENT_ID";
const SECRET = process.env.RUTTER_SECRET || "RUTTER_SECRET";

// handles exchanging the token and calling a sample API route
export default async (req, res) => {
  if (req.method === "POST") {
    // Process a POST request
    const { publicToken } = req.body;
    // Exchange publictoken for access_token
    try {
      const response = await axios.post(
        `https://${ENV_URL}/item/public_token/exchange`,
        {
          client_id: CLIENT_ID,
          public_token: publicToken,
          secret: SECRET,
        }
      );
      const {
        data: { access_token },
      } = response;
      // Respond with the access-token
      res.statusCode = 200;
      res.json({
        ...response.data,
        accessToken: access_token,
      });
    } catch (e) {
      console.error(e);
      if (!e.response) {
        return res.status(500).json({
          error: "Could not fetch data",
        });
      }
      const { data } = e.response;
      if (e?.response?.data?.error_code === "INVALID_CREDENTIALS") {
        return res.status(400).json({
          error: "Invalid store credentials",
        });
      }
      return res.status(500).json({
        error: "Unknown error occurred",
      });
    }
  } else {
    // Handle any other HTTP method
    res.statusCode(401).json({
      error_message: "Unauthorized Method",
    });
  }
};
