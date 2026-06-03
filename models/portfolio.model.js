import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  template: {
    type: String,
    default: "modern",
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  resumeUrl: {
    type: String,
    trim: true,
    default: "",
  },
   hero:[
     {
        fullName: {
        type: String,
      },
      
      title: {
        type: String,
      },
      description: {        
        type: String,
      },
        image: {
        type: String,
      }
     }       
  ],
  about:[
    {
      description: {        
        type: String,
        },
      skills: [
          {
            type: String,
          }
        ]
    } 
   ],
    experience:[
        {
            company: {
                type: String,
            },
            role: {
                type: String,
            },
            duration: {
                type: String,
            },
            description: {
                type: String,
            }
        }
    ], 
    education:[
        {
            institution: {
                type: String,
            },
            degree: {
                type: String,
            },
            duration: {
                type: String,
            },
            description: {
                type: String,
            }
        } 
    ],
    projects:[
        {
            name: {
                type: String,
            },
            description: {
                type: String,
            },
            technologies: [
                {
                    type: String,
                }
            ],
            link: {
                type: String,   
            },
            image: {
                type: String,
            }
        }
    ],
    contact: [
        {
            email: {
                type: String,
            },
            phone: {
                type: String,
            },
            location: {
                type: String,
            },
            addLink: [
                {
                    title: {
                        type: String,
                    },
                    url: {
                        type: String,
                    }
                }
            ]
             

        }
    ],
},
  {
    timestamps: true,
  },
);

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

export default Portfolio;
