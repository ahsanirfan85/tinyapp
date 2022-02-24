// Function to determine if a particular email exists in the user database - If yes, it returns the user ID, if not it returns 'false'
const getUserByEmail = (email, database) => {

  for (const each in database) {
    if (database[each].email === email) {
      return database[each].id;
    }
  }
}

module.exports = { getUserByEmail };