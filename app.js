//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const app = express();
const _ = require("lodash")

mongoose.set("strictQuery", true);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//MongoDB connection through Mongoose
mongoose.connect(
  "mongodb+srv://Tennis_247:Trx%402407%23@cluster0.uunbpu6.mongodb.net/todolistDB?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
); //, {useNewUrlParser: true, useUnifiedTopology: true}


const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to todolist-v2!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listschema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listschema);



app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if(err){
      console.log(err);
    }else if(foundItems.length === 0){
      Item.insertMany(defaultItems, function (err) {
        if(err){
          console.log(err);
        }else{
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne( {name: customListName}, function (err, foundList) {
    if(!err){
      if(!foundList){
        //create new list
          const list = new List({
            name: customListName,
            items: defaultItems,
          });

          list.save();
          res.redirect("/"+customListName);
      } else {
        //Display existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});




app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne( {name: listName}, function (err, foundList){
      foundList.items.push(item)
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});



app.post("/delete", function (req, res) {

  const checkedItemId = req.body.checkbox.trim();
  const listName = req.body.listName.trim();

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err){
        console.log("successfully deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull:{items :{_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        console.log("successfully deleted checked item");
        res.redirect("/"+ listName);
      }
    });
  }
});




app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started succesfully");
});
