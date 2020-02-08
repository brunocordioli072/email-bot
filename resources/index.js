const axios = require("axios");
API_URL = "http://localhost:8080";

module.exports = class EmailAPI {
  addMessage(message, email) {
    const url = `${API_URL}/customer/${email}/message`;
    return axios.post(url, message).then(response => response).catch(res => res);
  }
};
