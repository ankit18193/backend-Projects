// promises 

const asynchandler=(requestHandler)=>{
   return (req,res,next)=>{
        Promise
        .resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}
export {asynchandler}










// try catch method  



/*
const asynchandler=(func) => async (req,res,next) =>{
    try{
        await func(req,res,next);

    }
    catch(err){
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })

    }
}

export default asynchandler;
*/