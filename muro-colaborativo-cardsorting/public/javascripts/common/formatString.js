function formatString(display, text) {
    //Remove spaces at the beggining and the end
    var formatedString = text.trim();
    formatedString = formatedString.toLowerCase();
    if(display) {
      formatedString = formatedString.charAt(0).toUpperCase() + formatedString.slice(1);
    }
    return formatedString;
  }