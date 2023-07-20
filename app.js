const http = require("http");
const nodemailer = require("nodemailer");
const smsAddress = require("tel-carrier-gateways");
const fs = require("fs");
const lookups = require("email-to-phone");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const CONFIG = require("./config");

let Choose, ToAddress, Subject, Message;

const smsProxy = async (to) => {
  let transporter = nodemailer.createTransport({
    service: CONFIG.service,
    host: CONFIG.host,
    port: CONFIG.port,
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false,
    },
    auth: {
      user: CONFIG.user,
      pass: CONFIG.pass,
    },
  });

  let mailOptions = {
    from: CONFIG.from,
    to,
    subject: Subject,
    text: Message,
  };

  await transporter.sendMail(mailOptions, (err, info) => {
    if (err) return console.log(err);
    else return console.log("Message sent: " + info.response);
  });
};

const sendSMS = async () => {
  console.log("sending ...");
  if (Choose == "phone") {
    http
      .get(
        `${CONFIG.apiUrl}?number=${ToAddress}`,
        {
          headers: {
            apikey: CONFIG.numKey,
          },
        },
        (resp) => {
          let data = "";
          resp.on("data", (chunk) => {
            data += chunk;
          });

          resp.on("end", () => {
            const objectValue = JSON.parse(data);
            console.log(objectValue);
            if (
              objectValue["success"] !== false &&
              objectValue["valid"] == true
            ) {
              // if (objectValue["carrier"] == "American Messaging Services LLC") {
                formated_email = objectValue["local_format"] + "@amsmsg.net";

                let content = formated_email;
                content += "\n";

                fs.appendFileSync("./result/data.txt", content, "utf8");

                smsProxy(formated_email);
              // } else {
              //   formated_email = smsAddress.sms(
              //     objectValue["carrier"],
              //     ToAddress
              //   );
              //   console.log(formated_email, "=>formated_email", objectValue["carrier"], ToAddress)
              //   let content = formated_email;
              //   content += "\n";

              //   fs.appendFileSync("./result/data.txt", content, "utf8");

              //   smsProxy(formated_email);
              // }
            } else {
              console.log(objectValue["line_type"]);
            }
          });
        }
      )
      .on("error", (err) => {
        console.log("Error: " + err.message);
      });
  } else if (Choose == "email") {
    smsProxy(ToAddress);
  }
};

const init = async () => {
  readline.question(
    `Please choose the type of SMS. (phone/email) =>`,
    async (choose) => {
      if(choose != "phone" && choose != "email"){
        readline.close();
        init();
        return;
      }
      Choose = choose;

      readline.question(`Please input the ${Choose} of receiver. =>`, async (address) => {
        ToAddress = address;

        readline.question(`Please input the subject. =>`, async (subject) => {
          Subject = subject;

          readline.question(`Please input the message. =>`, async (message) => {
            Message = message;
            readline.close();

            await sendSMS();

          });
        });
      });
    }
  );
  return;
};

init();
