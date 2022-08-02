exports.create = (req, res) => {
    console.log(req.body)
    res.send({user: req.body}) 
}
