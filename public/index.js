  // Socket connection to the server
  const socket = io();



  //DOM Elements
  const chatbox = document.getElementById("chatBox");
  const inputField = document.getElementById("inputField");
  const sendBtn = document.getElementById("sendButton");


//function that append message to chatbot
const outputMessage =(message, sender)=>{
    const chatTextElement = document.createElement("div");
    chatTextElement.id = sender;
    chatTextElement.className = "message-text";
    chatTextElement.textContent = message;
    chatTextElement.innerHTML = message.replace(/\n/g, "<br>")

    const timestamp = new Date().toLocaleDateString();
    const timeElement = document.createElement("span");
    timeElement.className = "timestamp"
    timeElement.textContent = timestamp;


    const chatTextContainer = document.createElement("div");
    chatTextContainer.className ="message-container" + sender;

    const chatTextOuterContainer = document.createElement("div");
    chatTextOuterContainer.className = "message-outer-container" + sender;

    // chatTextContainer.innerHTML ="to";
    // chatTextOuterContainer.innerHTML = "chat"
    // chatTextElement.innerHTML ="Wlecome";

    chatTextContainer.appendChild(chatTextElement);
    chatTextContainer.appendChild(timeElement)
    chatTextOuterContainer.appendChild(chatTextContainer);
    chatbox.appendChild(chatTextOuterContainer);
    chatbox.scrollTop = chatbox.scrollHeight;

}

//handling sending message

const sendMessage =()=>{
    const message= inputField.value;
    if(message === "") return ;
    
    outputMessage(message , "user");
    //emit message
    socket.emit("user-message" , message);
    inputField.value = "";
}


 // Handling receiving messages from the server

 socket.on("bot-message", (message)=>{
  outputMessage(message, "bot")
 })

  //event listener
  sendBtn.addEventListener("click",  sendMessage)

  inputField.addEventListener("keypress", (event)=>{
    // event.keyCode or event.which  property will have the code of the pressed key
    let keyCode = event.keyCode ? event.keyCode : event.which;
    if(keyCode === 13){
        // console.log("Entered");
        sendMessage();
    }
  })