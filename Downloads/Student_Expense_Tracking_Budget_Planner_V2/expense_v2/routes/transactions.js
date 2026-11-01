const router = require("express").Router();
const Transaction = require("../models/Transaction");
router.get("/", async (req, res) => {
  try {
    const { month, type, search, category, from, to } = req.query;
    const filter = { user: req.user._id };
    if (type && ["income", "expense"].includes(type)) filter.type = type;
    if (category) filter.category = category;
    if (search) filter.$or = [{ title: { $regex: search, $options: "i" } }, { note: { $regex: search, $options: "i" } }, { category: { $regex: search, $options: "i" } }];
    if (from || to) filter.date = { ...(from ? { $gte: new Date(from + "T00:00:00") } : {}), ...(to ? { $lte: new Date(to + "T23:59:59.999") } : {}) };
    else if (month && /^\d{4}-\d{2}$/.test(month)) { const [y,m]=month.split("-").map(Number); filter.date={ $gte:new Date(y,m-1,1), $lt:new Date(y,m,1) }; }
    res.json(await Transaction.find(filter).sort({ date: -1, createdAt: -1 }));
  } catch (_err) { res.status(500).json({ message: "Could not load transactions." }); }
});
router.post("/", async (req, res) => {
  try { const { type,title,category,amount,date,note }=req.body;
    if (!["income","expense"].includes(type)||!title||!category||!Number.isFinite(Number(amount))||Number(amount)<=0) return res.status(400).json({message:"Enter a valid type, title, category and positive amount."});
    const item=await Transaction.create({user:req.user._id,type,title,category,amount:Number(amount),date:date?new Date(date+"T12:00:00"):new Date(),note:note||""}); res.status(201).json(item);
  } catch(_err){res.status(500).json({message:"Could not save transaction."});}
});
router.put("/:id", async (req,res)=>{ try { const {type,title,category,amount,date,note}=req.body;
  if(!["income","expense"].includes(type)||!title||!category||!Number.isFinite(Number(amount))||Number(amount)<=0) return res.status(400).json({message:"Enter valid transaction details."});
  const item=await Transaction.findOneAndUpdate({_id:req.params.id,user:req.user._id},{$set:{type,title,category,amount:Number(amount),date:new Date(date+"T12:00:00"),note:note||""}},{new:true,runValidators:true});
  if(!item)return res.status(404).json({message:"Transaction not found."});res.json(item);
 }catch(_err){res.status(400).json({message:"Could not update transaction."});}});
router.delete("/:id", async (req,res)=>{try{const deleted=await Transaction.findOneAndDelete({_id:req.params.id,user:req.user._id});if(!deleted)return res.status(404).json({message:"Transaction not found."});res.json({message:"Transaction deleted."});}catch(_err){res.status(400).json({message:"Invalid transaction ID."});}});
module.exports=router;
