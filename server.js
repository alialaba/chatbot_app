const express = require("express");
const app = express();
const http = require("http");
const session = require("express-session");
const socketio = require("socket.io");

const server = http.createServer(app);
const io = socketio(server);

const path = require("path")




//Set static folder
app.use(express.static(path.join(__dirname, 'public')))

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Render page
app.get('/', function(req, res) {
    res.render('index');
});



// session middleware
const sessionMiddleware = session({
    secret: "secret" || process.env.PORT,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });
  
  
  const suyaFries = {
    23: "Peppered Kilishi",
    24: "Danbu Namar",
    25: "Goated Suya",
    26: "Cattle Suya",
    27: "Chicken Suya",
  };
  
  const orderHistory = [];
  
  io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
  });


  io.on("connection",(socket)=>{
    console.log("someone connected", socket.id)
    //the unique identifier for the user's device
    const deviceId = socket.handshake.headers["user-agent"];
  
    // Check if the user already has an existing session
    if(socket.request.session[deviceId] && socket.request.session[deviceId].userName){
      // If the user already has a session, use the existing user name and current order
      socket.emit(
        "bot-message",
        `Welcome back, ${
          socket.request.session[deviceId].userName}! 
          You have a current order of ${socket.request.session[deviceId].currentOrder.join(", ")}`
      );
    }else{
       // the user does not have a session, create a new session for the user's device
       socket.request.session[deviceId] = {
        userName: "",
        currentOrder: [],
        deviceId: deviceId, // store the deviceId in the session object
      };
    }
  
  
    //Request for user's name if not provided
  
    if(!socket.request.session[deviceId].userName){
      socket.emit("bot-message" , "Hello, what is your name ?")
    }else{
      socket.emit(
        "bot-message",
        `Welcome back, ${socket.request.session[deviceId].userName}
        ! You have a current order of ${socket.request.session[deviceId].currentOrder.join(", ")}`
      );
    }
  
    
    let userName = socket.request.session[deviceId].userName;
  
    // Listen to incoming bot messages
    socket.on("bot-message", (message) => {
    //   console.log("Bot message received:", message);
      socket.emit("bot-message", message);
    });
  
    // Listen to incoming user messages
    socket.on("user-message", (message) => {
        // console.log("User message received:", message);
    
        if (!userName) {
          // Save  user's name and update the welcome message
          userName = message;
          socket.request.session[deviceId].userName = userName;
          socket.emit(
            "bot-message",
            `Welcome to the Fast Food ChatBot, ${userName}!\n1. Place an order\n99. Checkout order\n98. Order history\n97. Current order\n0. Cancel order`
          );
        } else {
          switch (message) {
            case "1":
              // Generate the list of items dynamically
              const itemOptions = Object.keys(suyaFries)
                .map((item) => `${item}. ${suyaFries[item]}`)
                .join("\n");
              socket.emit(
                "bot-message",
                `The menu items are:\n${itemOptions}\nType the item number to add to your order`
              );
              break;
            case "97":
              // Show the user their current order
              if (socket.request.session[deviceId].currentOrder.length > 0) {
                const currentOrder =
                  socket.request.session[deviceId].currentOrder.join(", ");
                socket.emit(
                  "bot-message",
                  `Your current order is: ${currentOrder}\n1. Place an order\n99. Checkout order\n98. Order history\n97. Current order\n0. Cancel order`
                );
              } else {
                socket.emit(
                  "bot-message",
                  `You don't have any items in your current order yet. Type '1' to see the menu.`
                );
              }
              break;
            case "99":
              // Checkout the order
              if (socket.request.session[deviceId].currentOrder.length > 0) {
                const currentOrder =
                  socket.request.session[deviceId].currentOrder.join(", ");
                orderHistory.push({
                  user: userName,
                  order: currentOrder,
                  date: new Date(),
                });
                socket.emit(
                  "bot-message",
                  `Thanks for your patronage, ${userName}! Your order of ${currentOrder} will be ready shortly.\n1. Place an order\n98. Order history\n0. Cancel order`
                );
                socket.request.session[deviceId].currentOrder = [];
              } else {
                socket.emit(
                  "bot-message",
                  `You don't have any items in your current order yet. Type '1' to see the menu.`
                );
              }
              break;
            case "98":
              // Show the order history
              if (orderHistory.length > 0) {
                const history = orderHistory
                  .map(
                    (order) =>
                      `${order.user} ordered ${
                        order.order
                      } on ${order.date.toDateString()}`
                  )
                  .join("\n");
                socket.emit(
                  "bot-message",
                  `Here is the order history:\n${history}\n1. Place an order\n98. Order history\n0. Cancel order`
                );
              } else {
                socket.emit(
                  "bot-message",
                  `There is no available order to cancel. Type '1' to see the menu list .`
                );
              }
              break;
            case "0":
              // Cancel the order
              const currentOrder = socket.request.session[deviceId].currentOrder;
              if (currentOrder.length === 0) {
                socket.emit(
                  "bot-message",
                  `There is no available order to cancel. Type '1' to see the menu list .`
                );
              } else {
                socket.request.session[deviceId].currentOrder = [];
                orderHistory.length = 0;
                socket.emit(
                  "bot-message",
                  `Your order has been cancelled.\n1. Place a new order\n98. Order history`
                );
              }
              break;
            default:
              // Add item to the current order
              const itemNumber = parseInt(message);
              if (!isNaN(itemNumber) && suyaFries[itemNumber]) {
                socket.request.session[deviceId].currentOrder.push(
                  suyaFries[itemNumber]
                );
                socket.emit(
                  "bot-message",
                  `You have added ${suyaFries[itemNumber]} to your current order\n Add another order from the menu\n Type '97' to see your current order\n '98' to see order history\n '99' to checkout\n '0' to cancel your order`
                );
              } else {
                socket.emit(
                  "bot-message",
                  `Invalid input. Type '1' to see the menu.`
                );
              }
              break;
          }
        }
      });
      // disconnection event
      socket.on("disconnect", () => {
        delete socket.request.session[deviceId];
    
        // console.log("User is  disconnected:", socket.id);
      });
  
  
  })
  

const PORT = 3200 || process.env.PORT;

//start server
server.listen(PORT, ()=>{
    console.log(`Server is running on PORT ${PORT}`);
})