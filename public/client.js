let userName, groupName, socket = io();
let input = $("input[type=text]"), messageBody = $(".chat-body"), userList = $(".user");

socket.on('connect', () => {
    userName = prompt("Enter your Name:");
    groupName = prompt("Enter your Group Name:");
    socket.emit('joinGroup', userName, groupName);
});

input.on('keyup', (e) => {
    if (e.key === 'Enter') sendMessage(e.target.value.trim());
});

function sendMessage(message) {
    if (!message) return;
    let msg = { user: userName, message };
    appendMessage(msg, 'outgoing');
    socket.emit('groupMessage', msg);
    input.val('');
}

function appendMessage({ user, message }, type) {
    messageBody.append(`<div class="message ${type}"><h4>${user}</h4><p>${message}</p></div>`);
    messageBody.scrollTop(messageBody[0].scrollHeight);
}

socket.on('groupMessage', (msg) => appendMessage(msg, 'incoming'));

socket.on('updateUsers', (users) => {
    userList.empty();
    $('.group').text(groupName);
    users.forEach(user => userList.append(`<span><img title=${user} src="user.png"> </span>`));
});

// Handle image and document uploads
$('#imageInput').on('change', function (e) {
    let reader = new FileReader();
    let file = e.target.files[0];

    if (file.type.startsWith('image/')) {
        reader.onload = (evt) => {
            appendImage(evt.target.result, 'outgoing', userName); // Append image locally for sender
            socket.emit('uploadImage', evt.target.result, userName); // Send image to server
        };
    } else {
        reader.onload = (evt) => {
            appendFile(file.name, evt.target.result, 'outgoing', userName); // Append file locally for sender
            socket.emit('uploadFile', evt.target.result, userName, file.name); // Send file to server
        };
    }
    
    reader.readAsDataURL(file);
    $('#imageInput').val('');
});

function appendImage(data, type, username) {
    messageBody.append(`<div class="message ${type}"><h4>${username}</h4><img src="${data}" class="uploadedImage"/></div>`);
    messageBody.scrollTop(messageBody[0].scrollHeight);
}

function appendFile(fileName, data, type, username) {
    messageBody.append(`<div class="message ${type}"><h4>${username}</h4><a href="${data}" download="${fileName}">${fileName}</a></div>`);
    messageBody.scrollTop(messageBody[0].scrollHeight);
}

// Listen for image and file broadcasts from server
socket.on('publishImage', ({ data, username }) => appendImage(data, 'incoming', username));
socket.on('publishFile', ({ data, username, fileName }) => appendFile(fileName, data, 'incoming', username));
