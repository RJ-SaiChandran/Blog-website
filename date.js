var currentDate = new Date();

var year = currentDate.getFullYear();
var month = currentDate.getMonth() + 1;
var day = currentDate.getDate();
var hours = currentDate.getHours();
var minutes = currentDate.getMinutes();
var seconds = currentDate.getSeconds();

var formattedDate =
  year + "-" + addLeadingZero(month) + "-" + addLeadingZero(day);
var formattedTime =
  addLeadingZero(hours) +
  ":" +
  addLeadingZero(minutes) +
  ":" +
  addLeadingZero(seconds);

function addLeadingZero(number) {
  return number < 10 ? "0" + number : number;
}

module.exports = {
  formattedDate: formattedDate,
  formattedTime: formattedTime,
};
