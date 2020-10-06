//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-Vinayak:Test1012@cluster0.fzm0b.mongodb.net/todolistDB",{ useNewUrlParser: true });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name : "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});


const defaultItems = [item1,item2,item3];
const listSchema   = {
  name: String,
  items: [itemsSchema]
};

const List  = mongoose.model("List",listSchema);
app.get("/", function(req, res) {

  const day = date.getDate();
  Item.find({},function(err,foundItems){
    if(foundItems.length === 0)
    {
        Item.insertMany(defaultItems,function(err){
          if(err)
          {
            console.log(err);
          }
          else{
            console.log("Successfully saved default item to DB.");
          }
        });
        res.redirect("/");
    }
    else{
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  });
});
app.get("/:customListName",function(req,res){

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName},function(err,foundList){
      if(!err)
      {
        if(!foundList)
        {
          // Create a new List
          const list = new List({
            name:customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);
        }
        else{
          // show an existing list
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

  const today = date.getDate();
  if(listName === today)
  {
    item.save();
    res.redirect("/");
  }else{
      List.findOne({name:listName},function(err,foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
    });
  }
});

app.post("/delete",function(req,res){
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;



  const Today = date.getDate();
  if(listName ===  Today)
  {
    Item.findByIdAndRemove(checkedId,function(err){
      if(!err)
      {
        console.log("Successfully deleted item");
        res.redirect("/");
      }
    });
  }
  else{
      List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedId}}},function(err,foundList){
        if(!err)
        {
          res.redirect("/"+listName);
        }
      })
  }

});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server has started on port 3000");
});
