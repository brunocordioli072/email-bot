const sendpulse = require("sendpulse-api");
const fs = require('fs');
const APIService = require("../resources");
const api = new EmailAPI();
var Imap = require("imap"),
  inspect = require("util").inspect;

let rawdata = fs.readFileSync('../CONFIG.json');
let sys_config = JSON.parse(rawdata);

var API_USER_ID = sys_config.API_USER_ID;
var API_SECRET = sys_config.API_SECRET;
var TOKEN_STORAGE = sys_config.TOKEN_STORAGE ;

const imap = new Imap({
  user: sys_config.USER_EMAIL,
  password: sys_config.USER_EMAIL_PASSWORD,
  host: "imap.gmail.com",
  port: 993,
  tls: true
});

function openInbox(cb) {
  imap.openBox("INBOX", true, cb);
}

module.exports = class Main {
  async createEmail(html, text, subject, to) {
    var email = {
      html: html,
      text: text,
      subject: subject,
      from: {
        name: sys_config.USER_EMAIL,
        email: sys_config.USER_EMAIL
      },
      to: [to]
    };
    return email;
  }

  async sendEmail(email) {
    sendpulse.init(API_USER_ID, API_SECRET, TOKEN_STORAGE, function (token) {
      if (token && token.is_error) {
        // error handling
      }
      console.log("your token: " + token);

      var answerGetter = function (data) {
        console.log(data);
      };

      sendpulse.smtpSendMail(answerGetter, email);
    });
  }
  
  async getUnreadEmailsFromYesterdayAndHaveSubject() {
    return new Promise(resolve => {
      function openInbox(cb) {
        imap.openBox("INBOX", false, cb);
      }

      imap.once("ready", () => {
        openInbox((err, box) => {
          if (err) throw err;
          var yesterday = new Date();
          yesterday.setTime(yesterday.getTime() - 15 * 60 * 1000);
          imap.search(["UNSEEN", ["SINCE", yesterday]], function (err, results) {
            if (err) throw err;

            var f = imap.fetch(results, {
              bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)",
              struct: true,
              markSeen: true
            });
            f.on("message", function (msg, seqno) {
              msg.on("body", function (stream, info) {
                var buffer = "";
                stream.on("data", function (chunk) {
                  buffer += chunk.toString("utf8");
                });
                stream.once("end", async function () {
                  msg.once("attributes", function (attrs) {
                    let uid = attrs.uid;
                    imap.addFlags(uid, ["\\Seen"], function (err) {
                      if (err) {
                        console.log(err);
                      } else {
                        console.log("Marked as read!");
                      }
                    });
                  });

                  let headers = Imap.parseHeader(buffer);
                  let from = headers.from.join();
                  let date = headers.date.join();
                  let subject = headers.subject.join();
                  if (subject.includes("SUBJECT_YOU_WANT_TO_SEARCH")) {
                    var message = {
                      subject: "SUBJECT_YOU_WANT_TO_SEARCH",
                      body: `${buffer}`
                    };
                    // here it would be made the post to the API for the storage of the messages by user.
                    let res = await api.addMessage(message, from);
                    console.log(res);
                  }
                });
              });
            });

            f.once("end", function () {
              imap.end();
            });
          });
        });
      });
      imap.once("error", function (err) {
        console.log(err);
      });
      imap.once("end", function () {
        console.log("Connection ended");
      });
      imap.connect();
    });
  }
};
