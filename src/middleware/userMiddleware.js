const attachUserToViews = (req, res, next) => {
  res.locals.user = req.user || null; // Add user to locals for use in EJS templates
  next();
};

module.exports = attachUserToViews;
