require('./db/conn');
require('./pass-auth');
const passport = require('passport');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const expressSession = require('express-session');
const express = require('express');
const app = express();
const hbs = require('hbs');
const path = require('path');
const Courses = require('./module/courses');
const Student = require('./module/student');
const Instructor = require('./module/instructor');
const Payments = require('./module/payment');
const Queries = require('./module/query');
const Feedback = require('./module/feedback');
const Grid = require('gridfs-stream');
const fs = require('fs');
const CourseContent = require('./module/course_content');
const Razorpay = require('razorpay');
// const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;



// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({storage:storage});

app.use(express.json());
app.use(express.urlencoded({extended:false}))
// app.use(bodyParser.urlencoded({ extended: true }));
app.use('/css',express.static(path.join(__dirname,"../node_modules/bootstrap/dist/css")));
app.use('/js',express.static(path.join(__dirname,"../node_modules/bootstrap/dist/js")));
app.use('/jq',express.static(path.join(__dirname,"../node_modules/jquery/dist")));
app.use('/public',express.static(path.join(__dirname,"../public")));

const temp_path = path.join(__dirname,"../templates/views");
const par_path = path.join(__dirname,"../templates/partials");


app.set("view engine","hbs");
app.set("views",temp_path);
hbs.registerPartials(par_path);
hbs.registerHelper('base64Encode', function(data) {
    return new hbs.SafeString(Buffer.from(data).toString('base64'));
  });
  hbs.registerHelper('eq', function (a, b) {
    return a === b ;
  });




  
// nodejs authentication starts
app.use(expressSession({
    secret: 'AyushRathorApp',
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());




app.get("/",async (req,res) => {
    const courses = await Courses.find();
    let session = false;
    if (req.session && req.session.user) {
        session = true;
        const student_name = req.session.user.student_name;
        res.render("index",{
            courses:courses,
            session:session,
            student_name:student_name
        });
    }
    else{
        res.render("index",{courses:courses,session:session});
    }
})


app.get('/login/google', passport.authenticate('google', {scope:['profile email']}));
app.get('/login/facebook', passport.authenticate('facebook', {scope: ['email']}));
app.get('/login/twitter', passport.authenticate('twitter'));
app.get('/login/linkedin', passport.authenticate('linkedin',{scope: ['r_emailaddress', 'r_liteprofile'] }));


app.get('/google', passport.authenticate('google'),(req,res)=>{
    res.redirect('/');
})

app.get('/facebook', passport.authenticate('facebook'),(req,res)=>{
    res.redirect('/');
})

app.get('/twitter', passport.authenticate('twitter'),(req,res)=>{
    res.redirect('/');
});

app.get('/linkedin', passport.authenticate('linkedin'),(req,res)=>{
    res.redirect('/');
});

// app.get('/logout', (req,res)=>{
//       req.logout((err) => {
//         if (err) {
//           console.error('Error during logout:', err);
//         }
//         console.log("Logout successfully");
//         res.redirect('/');
//       });
// });
// nodejs authentication ends


app.post("/upload",upload.single('image'),async (req,res) => {
     try{ console.log(req.body);
        const course = new Courses({
            course_name : req.body.course_name,
            course_desc : req.body.course_desc,
            course_field : req.body.course_field,
            course_price : req.body.course_price,
            instructor_id : req.body.instructor_id,
        //     course_img : {
        //     data : req.file.buffer,
        //     contentType : req.file.mimetype
        // }
         })
         console.log(course)
        // const result = await course.save();
        // console.log(result)
        // res.status(201).send(result);
    }
    catch(e){
        res.status(500).send(e);
    }
})

app.get("/registration",(req,res) => {
    res.render("registration");
})


app.post("/student_signup",async (req,res) => {
    try{ console.log(req.body);
       const student = new Student({
           student_name : req.body.name,
           student_email : req.body.email,
           student_pass : req.body.pass,
        })
       const result = await student.save();
       console.log(result)
       if(result){
            req.session.user = {
                student_id: result._id.toString(),
                student_name: result.student_name,
                student_email: result.student_email 
            };
            res.status(201).redirect('/');
        }
    //    res.status(201).redirect('/');
   }
   catch(e){
       res.status(500).send(e);
   }
})

app.post("/student_login",async(req,res) => {
    try{ console.log(req.body);
        const stu_email = req.body.email;
        const stu_pass = req.body.pass;
        const result = await Student.find({$and : [{student_email : stu_email},{student_pass : stu_pass}]});
        console.log(result[0])
        console.log(result[0]._id.toString());
        if(result){
            req.session.user = {
                student_id: result[0]._id.toString(),
                student_name: result[0].student_name,
                student_email: result[0].student_email 
              };
            res.status(201).redirect('/');
        }
        else{
            res.status(201).send('Invalid Credentials');
        }
    }
    catch(e){
        res.status(500).send(e);
    }
})

app.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      } else {
        res.redirect('/'); 
      }
    });
  });

app.post("/instructor_signup",async (req,res) => {
    try{ console.log(req.body);
       const instructor = new Instructor({
           instructor_name : req.body.inst_name,
           instructor_email : req.body.inst_email,
           instructor_pass : req.body.inst_pass,
        })
       const result = await instructor.save();
       console.log(result)
       const courses = await Courses.find();
       res.status(201).render("instructor_phase",{
        instructor:result,
        courses:courses
    });
   }
   catch(e){
       res.status(500).send(e);
   }
})

app.post("/instructor_login",async(req,res) => {
    try{ console.log(req.body);
        const inst_email = req.body.inst_email;
        const inst_pass = req.body.inst_pass;
        const result = await Instructor.find({$and : [{instructor_email : inst_email},{instructor_pass : inst_pass}]}).count();
        console.log(result);
        if(result){
            const instructor = await Instructor.find({$and : [{instructor_email : inst_email},{instructor_pass : inst_pass}]});
            console.log(instructor[0]._id.toString())
            const courses = await Courses.find({instructor_id:instructor[0]._id.toString()});
            res.status(201).render("instructor_phase",{
                instructor:instructor[0],
                instructor_id: instructor[0]._id.toString(),
                courses:courses
            });
        }
        else{
            res.status(201).send('Invalid Credentials');
        }
    }
    catch(e){
        res.status(500).send(e);
    }
})


app.post("/instructor_update",upload.single('inst-image'), async (req,res) => {
    try{ console.log("uhggvv",req.body);

        console.log(req.file.buffer,req.file.mimetype);
        
        const inst_pass = req.body.inst_pass1;
        if(inst_pass.trim() === ''){ console.log("pp")
            const result = await Instructor.updateOne({instructor_email:req.body.inst_email},{$set : {
                instructor_img:{
                    data:req.file.buffer,
                    contentType:req.file.mimetype
                },
                instructor_phone:req.body.inst_phone,
                instructor_address:req.body.inst_add
            }})
            console.log("ll",result)
        }
        else if(req.body.inst_pass1===req.body.inst_pass2){
            const result = await Instructor.updateOne({instructor_email:req.body.inst_email},{$set : {
                instructor_img:{
                    data:req.file.buffer,
                    contentType:req.file.mimetype
                },
                instructor_phone:req.body.inst_phone,
                instructor_address:req.body.inst_add,
                instructor_pass:req.body.inst_pass1
            }})
            console.log("KK",result)
        }
        else{
            console.log("Passwords not matching")
        }
        
    //    const instructor = new Instructor({
    //        instructor_name : req.body.inst_name,
    //        instructor_email : req.body.inst_email,
    //        instructor_pass : req.body.inst_pass,
    //     })
    //    const result = await instructor.save();
    //    console.log(result)
    //    const courses = await Courses.find();
    //    res.status(201).render("instructor_phase",{
    //     instructor:result,
    //     courses:courses
    // });
    res.status(200).send(e);
   }
   catch(e){
       res.status(500).send(e);
   }
})

app.get("/stu_queries",async(req,res) => {
    const {instructor_id} = req.query;
    const courses = await Courses.find({instructor_id:instructor_id});
    const courseIds = courses.map(course => course._id.toString());
    console.log(courseIds)
    const queries = await Queries.find({ course_id: { $in: courseIds } },{course_id:1,student_name:1,query_asked:1,query_reply:1});
    console.log(queries)
    res.render("inst_studentQuery",{
        courses:courses,
        queries:queries,
        courseIds:courseIds,
        instructor_id:instructor_id
    });
})

app.get("/instructor",(req,res) => {
    res.render("instructor");
})

app.get("/instructor_reg",(req,res) => {
    res.render("instructor_reg");
})

app.get("/instructor_phase",async(req,res) => {
    const courses = await Courses.find();
    res.render("instructor_phase",{courses:courses});
})

app.get("/contact",(req,res) => {
    if (req.session && req.session.user) {
        const userId = req.session.user.student_id;
        console.log(userId)}
    res.render("contact");
})




var razorpay = new Razorpay({ key_id: 'rzp_test_wgrbE6Uimh0DjV', key_secret: 'zi9vrJtrMFsj9WCoATdaz7vO' })
  
app.post('/order',(req,res) => {
  const course = req.body.course;
  console.log(course);
  var options = {
      amount: course.course_price*100,  // amount in the smallest currency unit
      currency: "INR"
    };
    razorpay.orders.create(options, function(err, order) {
      console.log(order);
      res.json(order);
    });
})

app.post('/is-order-complete', async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const { course_id, course_name, course_price } = req.query;
    const { student_id, student_name, student_email } = req.session.user;

    try {
        const paymentDocument = await razorpay.payments.fetch(razorpay_payment_id);

        if (paymentDocument.status === 'captured') {
            const Payment = new Payments({
                razorpay_payment_id: razorpay_payment_id,
                razorpay_order_id: razorpay_order_id,
                razorpay_signature: razorpay_signature,
                course_id: course_id,
                course_name: course_name,
                course_price: course_price,
                student_id: student_id,
                student_email: student_email,
                student_name: student_name
            });

            const result = await Payment.save();
            console.log(Payment);
            res.redirect(`/course?course_id=${course_id}`);
        } else {
            res.status(400).send('Payment not captured');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/feedback',async(req,res) => {
    const {course_id,course_name,feedback} = req.query;
    console.log(course_id,course_name,feedback);
    if (req.session && req.session.user) {
        const student_id = req.session.user.student_id;
        const student_name = req.session.user.student_name;

        const feedbackObj = new Feedback({
            course_id:course_id,
            course_name:course_name,
            student_id:student_id,
            student_name:student_name,
            feedback:feedback
         })
        const result = await feedbackObj.save();
        console.log(result)
        res.redirect(`/course?course_id=${course_id}`);
    }
    else{
        res.redirect(`/registration`);
    }
})



app.get('/query_update',async(req,res) => {
    const {instructor_id,comment,query_id} = req.query;
    console.log(instructor_id,comment,query_id);
    const result = await Queries.updateOne({ _id: new ObjectId(query_id)  }, { $set: { query_reply: comment } });
    console.log(result)
    res.redirect(`/stu_queries?instructor_id=${instructor_id}`);
})


app.get('/query',async(req,res) => {
    const {course_id,course_name,query_asked} = req.query;
    console.log(course_id,course_name,query_asked);
    if (req.session && req.session.user) {
        const student_id = req.session.user.student_id;
        const student_name = req.session.user.student_name;

        const query = new Queries({
            course_id:course_id,
            course_name:course_name,
            student_id:student_id,
            student_name:student_name,
            query_asked:query_asked
         })
        const result = await query.save();
        console.log(result)
        res.redirect(`/course?course_id=${course_id}`);
    }
})




app.get('/course', async(req, res) => { console.log("ll")
    const {course_id} = req.query;
    console.log(course_id)
    const course = await Courses.findById(course_id);
    const instructor = await Instructor.findById(course.instructor_id)
    const inst_courses = await Courses.find({instructor_id:instructor._id}).count()
    console.log(inst_courses)
    const course_topics = await CourseContent.distinct("topic_name",{course_id:course_id})
    console.log(course_topics)
    const course_content = await CourseContent.find({course_id:course_id})
    // console.log(course_content)
    // console.log(course_id,course_name);
    let subscribed = false;
    let session = false;
    if (req.session && req.session.user) {
        session = true;
        const student_id = req.session.user.student_id;
        const queries = await Queries.find({$and : [{student_id : student_id},{course_id:course_id}]},{_id:0,query_asked:1,query_reply:1});
        console.log(queries)
        const subscriptionCount = await Payments.find({$and : [{student_id : student_id},{course_id:course_id}]}).count();
        console.log(subscriptionCount);
        subscribed = subscriptionCount > 0;
        res.render("course",{
            course:course,
            course_topics : course_topics,
            course_content : course_content,
            subscribed:subscribed,
            queries:queries,
            instructor:instructor,
            inst_courses:inst_courses,
            session:session     
        });
    }
    else{
    res.render("course",{
        course:course,
        course_topics : course_topics,
        course_content : course_content,
        instructor:instructor,
        inst_courses:inst_courses,
        session:session
    });
    }
});

app.get('/create_course', async(req, res) => { 
    const {instructor_id} = req.query;
    console.log(instructor_id);
    const courses = await Courses.find({instructor_id:instructor_id});
    res.render("create_course",{
        courses:courses,
        instructor_id:instructor_id
    });
});

app.get('/course_detaile', async(req, res) => {
    const {course_id,instructor_id} = req.query;
    console.log(course_id)
    console.log(instructor_id)
    const course = await Courses.findById(course_id);
    // console.log(course)
    const courses = await Courses.find({instructor_id:instructor_id}); 
    const course_topics = await CourseContent.distinct("topic_name",{course_id:course_id})
    console.log(course_topics)
    const course_content = await CourseContent.find({course_id:course_id})
    res.render("course_detail",{
        courses:courses,
        course:course,
        course_topics:course_topics,
        course_content:course_content,
        instructor_id:instructor_id
    });
});

app.get('/upload_content', async(req, res) => { 
    const {instructor_id,course_id} = req.query;
    const courses = await Courses.find({instructor_id:instructor_id});
    if(!course_id){
        let courseId = courses[0]._id.toString();
        let courseName = courses[0].course_name;
        console.log("nothing there ",courseId)
        const course_content = await CourseContent.find({course_id:courseId});
        res.render("upload_content",{
            courseId:courseId,
            courseName:courseName,
            courses:courses,
            course_content:course_content,
            instructor_id:instructor_id
        });
    }
    else{
        const course_content = await CourseContent.find({course_id:course_id});
        res.render("upload_content",{
            courses:courses,
            course_content:course_content,
            instructor_id:instructor_id
        });
    }
});

app.get('/workspace', async(req, res) => { 
    const {instructor_id} = req.query;
    const courses = await Courses.find({instructor_id:instructor_id});
    console.log(courses.length)
    const courseIds = courses.map(course => course._id.toString());
    console.log(courseIds)
    const payments = await Payments.find({ course_id: { $in: courseIds } });
    console.log(payments)
    const feedbacks = await Feedback.find({ course_id: { $in: courseIds } });
    console.log(feedbacks)

        // const course_content = await CourseContent.find({course_id:course_id});
        res.render("workspace",{
            instructor_id:instructor_id,
            courses:courses,
            payments:payments,
            feedbacks:feedbacks,
            courseIds:courseIds
        });
});

app.listen(port,() => {
    console.log(`Server is running at port ${port}`);
})













app.get("/pr",(req,res) => {
    res.render("pr");
})
 


app.post('/upload_content_video', upload.single('video'), async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return res.status(400).send('No video data received.');
      }
      let instructor_id = req.body.inst_id;
      console.log("ijnnkjjnjmnjn ",instructor_id)
      const video_Data = req.file.buffer;
    //   console.log(video_Data)
      console.log(req.body.course_id)
      console.log(req.body.course_name)
    //   console.log(req.file.buffer)
      const video = new CourseContent({
      course_name: req.body.course_name,  
      topic_name: req.body.topic_name,
      content_name: req.body.content_name,
      course_id: req.body.course_id,
      videoData: video_Data
    });

    // console.log(video)

//   const video = new VideoModel({ title, description, videoData });


  try {
    await video.save();
    res.redirect(`/upload_content?instructor_id=${instructor_id}`)
    // res.status(200).send('Video uploaded successfully.');
  } catch (error) {
    res.status(500).send('Error uploading video.');
  }
});


// // Set up routes for file upload and retrieval
// app.post('/upload_content', upload.single('video'), (req, res) => {
//     console.log("okokok ",req.body,req.file.originalname,req.file.buffer)
//  // Store the uploaded video in GridFS
//   const writeStream = gfs.createWriteStream({
//     filename: req.file.originalname,
//   });
//   writeStream.write(req.file.buffer);
//   writeStream.end();

//   writeStream.on('close', (file) => {
//     // Create a new video document in the database
//     const newVideo = new CourseContent({
//       course_name: req.body.course_name,  
//       topic_name: req.body.topic_name,
//       content_name: req.body.content_name,
//       video_Id: file._id,
//     });

//     newVideo.save((err, savedVideo) => {
//       if (err) {
//         return res.status(500).send(err);
//       }
//       res.json({ fileId: file._id });
//     });
//   });
// });


app.get('/video/:id', async (req, res) => {
    const videoId = req.params.id;
    console.log(videoId)
    try {
      const video = await CourseContent.findById(videoId);
    //   console.log("nn",video.videoData)
      if (video) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', video.videoData.length);
        res.send(video.videoData);
        //res.render("videoPlayer",{video : video.videoData});
      } else {
        res.status(404).send('Video not found');
      }
    } catch (error) {
      res.status(500).send('Error retrieving video');
    }
  });

// app.get('/video/:id', async (req, res) => {
//     const videoId = req.params.id;
//     try {
//         const video = await CourseContent.findById(videoId);
//         if (video) {
//             // Pass the video URL to the template
//             res.render('videoPlayer', { videoUrl: `/video/${videoId}` });
//         } else {
//             res.status(404).send('Video not found');
//         }
//     } catch (error) {
//         res.status(500).send('Error retrieving video');
//     }
// });

  

  app.get('/upload1', (req, res) => {
    const {course_id} = req.query;
    // Do something with the received id, like saving it to a database or processing it.
    console.log(`Received id: `,course_id );
    res.send('ID received');
  });





// app.get('/video/:id', (req, res) => {
//     // Retrieve the video ID from the URL
//     const videoId = req.params.id;
  
//     // Find the corresponding video document in the database
//     Video.findOne({ videoId }, (err, video) => {
//       if (err || !video) {
//         return res.status(404).send('Video not found');
//       }
  
//       // Retrieve and serve the video file using the video ID from the database
//       const readStream = gfs.createReadStream({ _id: video.videoId });
//       readStream.pipe(res);
//     });
//   });
  
//   app.listen(3000, () => {
//     console.log('Server is running on port 3000');
//   });






// app.get('/video/:id', (req, res) => {
//   // Retrieve the video ID from the URL
//   const videoId = req.params.id;

//   // Find the corresponding video document in the database
//   Video.findOne({ videoId }, (err, video) => {
//     if (err || !video) {
//       return res.status(404).send('Video not found');
//     }

//     // Retrieve and serve the video file using the video ID from the database
//     const readStream = gfs.createReadStream({ _id: video.videoId });
//     readStream.pipe(res);
//   });
// });

// app.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });


  




// const express = require('express');
// const app = express();
// const bcrypt = require('bcrypt'); // You would need to handle user password hashing securely in your application
// const users = []; // Simulated user data; replace with your database logic

// app.get('/reset-password/:token', async (req, res) => {
//   try { console.log('ll')
//     const token = req.params.token;

//     // Find the user associated with this token in your database
//     const user = users.find((user) => user.resetToken === token);

//     if (!user) {
//       // Token not found or expired
//       return res.status(400).json({ message: 'Invalid or expired token' });
//     }

//     // Display a password reset form to the user
//     // In your frontend, you would create a form for the user to enter a new password

//     // Example frontend form:
//     res.send(`
//       <html>
//       <body>
//         <h2>Reset Your Password</h2>
//         <form action="/resetpassword/${token}" method="POST">
//           <label for="password">New Password:</label>
//           <input type="password" id="password" name="password" required>
//           <button type="submit">Reset Password</button>
//         </form>
//       </body>
//       </html>
//     `);

//     // Handle the form submission in another route or endpoint (e.g., POST /resetpassword/:token)
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Add a route to handle the password reset form submission
// app.post('/resetpassword/:token', async (req, res) => {
//   try {
//     const token = req.params.token;
//     const newPassword = req.body.password; // Assuming you have a form field with the name "password"

//     // Find the user associated with this token in your database
//     const user = users.find((user) => user.resetToken === token);

//     if (!user) {
//       // Token not found or expired
//       return res.status(400).json({ message: 'Invalid or expired token' });
//     }

//     // Hash and update the user's password in the database
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     user.password = hashedPassword;

//     // Remove the reset token (optional, depending on your implementation)

//     // Redirect the user to a login page or display a success message
//     res.send('Password reset successful! You can now log in.');

//     // You might want to clear the token or mark it as used in your database
//     // ...
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Start your Express app
// app.listen(5002, () => {
//   console.log('Server is running on port 5002');
// });
