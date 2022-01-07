module.exports = (req, res, next) => {
  // NOTE: Exclude TRACE and TRACK methods to avoid XST attacks.
  // this middleware is used on every route
  const allowedMethods = [
    "OPTIONS",
    "HEAD",
    "CONNECT",
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
  ];

  if (!allowedMethods.includes(req.method)) {
    res.status(405).send(`${req.method} not allowed.`);
    return
  }

  next();
};