# 🌺 Hawaii Today - Your Hawaii Information Website

## What Is This?

Hawaii Today is a website that shows real-time information about Hawaii, including:
- Current weather for any Hawaiian island
- Surf conditions and wave heights
- Latest local news from Hawaii
- Events happening on the islands
- Traffic updates and flight information

Think of it like a "Hawaii dashboard" that brings all the important island information to one place!

## What You'll Need

Before we start, make sure you have:
- ✅ A computer (Windows, Mac, or Linux)
- ✅ Internet connection
- ✅ A GitHub account (which you already have!)
- ✅ A Vercel account (which you already have!)
- ⏱️ About 30-45 minutes of your time

**Don't worry if you've never coded before - we'll walk through everything step by step!**

---

## Step 1: Get the Code onto Your Computer

### Download the Code Files

1. **Download Node.js** (This is a program that lets you run the website code)
   - Go to [nodejs.org](https://nodejs.org)
   - Click the big green button that says "Download for [Your Operating System]"
   - Install it just like any other program (keep clicking "Next")

2. **Open your Terminal/Command Prompt**
   - **Windows**: Press `Windows Key + R`, type `cmd`, press Enter
   - **Mac**: Press `Command + Space`, type `terminal`, press Enter
   - **Linux**: Press `Ctrl + Alt + T`

3. **Check if Node.js installed correctly**
   - Type this and press Enter: `node --version`
   - You should see something like `v18.17.0` or higher
   - If you get an error, try restarting your computer and try again

4. **Download the website code**
   - In your terminal, type these commands one at a time (press Enter after each):
   ```
   cd Desktop
   git clone https://github.com/your-username/hawaii-today.git
   cd hawaii-today
   ```
   
   **Wait, what's my username?** Replace `your-username` with your actual GitHub username. You can find it by going to GitHub.com and looking at the top-right corner.

---

## Step 2: Set Up the Website Files

### Install the Website Dependencies

Think of dependencies like ingredients for a recipe - we need to download all the pieces that make the website work.

1. **In your terminal** (still in the hawaii-today folder), type:
   ```
   npm install
   ```
   
2. **Wait for it to finish** (this might take 2-5 minutes)
   - You'll see lots of text scrolling by - this is normal!
   - When it's done, you'll see your cursor blinking again

### Create Your Settings File

1. **Create a file called `.env.local`**
   - **Easy way**: Right-click in your hawaii-today folder → New → Text Document
   - Name it exactly: `.env.local` (including the dot at the beginning)
   - **If using Notepad**: Make sure it doesn't save as `.env.local.txt`

2. **Open the file** and copy-paste this text into it:
   ```
   # Basic Settings (Required)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   
   # Security Settings (Required)
   CRON_SECRET=my-secret-password-123
   ADMIN_API_KEY=my-admin-key-456
   
   # Optional Settings (Leave these for now)
   # OPENAI_API_KEY=your_openai_api_key_here
   # BEEHIIV_API_KEY=your_beehiiv_api_key_here
   # ONESIGNAL_APP_ID=your_onesignal_app_id_here
   ```

3. **Save the file**

**What does this file do?** This tells your website important settings, like what web address to use and security passwords.

---

## Step 3: Test Your Website Locally

### Start Your Website

1. **In your terminal**, type:
   ```
   npm run dev
   ```

2. **Look for this message**:
   ```
   ✓ Ready in 2.3s
   ✓ Local: http://localhost:3000
   ```

3. **Open your web browser** and go to: `http://localhost:3000`

4. **You should see your Hawaii Today website!** 🎉

### What You Should See

- A Hawaii-themed dashboard with weather, surf, and news
- Some sections might show "Loading..." or sample data - this is normal!
- The design should look clean and work on your phone too

### If Something Goes Wrong

**Problem**: "Command not found" error
- **Solution**: Make sure Node.js installed correctly (go back to Step 1)

**Problem**: Website won't load at localhost:3000
- **Solution**: 
  1. Press `Ctrl + C` in your terminal to stop the website
  2. Wait 10 seconds
  3. Type `npm run dev` again

**Problem**: Lots of red error text
- **Solution**: 
  1. Press `Ctrl + C` to stop
  2. Type `npm install` again
  3. Try `npm run dev` again

---

## Step 4: Put Your Website on the Internet

### Upload to GitHub

1. **Go to GitHub.com** and sign in
2. **Click the green "New" button** (or the "+" in the top-right corner)
3. **Repository name**: Type `hawaii-today`
4. **Make sure it's set to "Public"**
5. **Click "Create repository"**
6. **Follow the instructions GitHub shows you** - it should look like this:
   ```
   git remote add origin https://github.com/your-username/hawaii-today.git
   git branch -M main
   git push -u origin main
   ```

### Deploy to Vercel (Make it Live!)

1. **Go to Vercel.com** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**:
   - You should see "hawaii-today" in the list
   - Click "Import" next to it
4. **Configure your project**:
   - **Project Name**: `hawaii-today`
   - **Framework**: Should automatically detect "Next.js"
   - **Root Directory**: Leave as `./`
5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add these one by one:
     ```
     NEXT_PUBLIC_SITE_URL = https://your-project-name.vercel.app
     CRON_SECRET = my-secret-password-123
     ADMIN_API_KEY = my-admin-key-456
     ```
   - Replace `your-project-name` with whatever Vercel suggests for your URL
6. **Click "Deploy"**
7. **Wait 2-3 minutes** for it to build and deploy

### Your Website is Live! 🚀

After deployment, you'll get a URL like `https://hawaii-today-abc123.vercel.app`

**That's your live website that anyone can visit!**

---

## Step 5: Make It Even Better (Optional)

### Get a Custom Web Address

Instead of the long Vercel URL, you can get something like `www.hawaiitoday.com`:

1. **Buy a domain name** from:
   - Namecheap.com (recommended for beginners)
   - GoDaddy.com
   - Google Domains

2. **Connect it to Vercel**:
   - In Vercel, go to your project → Settings → Domains
   - Add your new domain name
   - Follow the instructions to update your domain's DNS settings

### Add Real Data Sources (Advanced)

Right now your website shows sample data. To get real live data:

1. **Weather**: Already works! Uses free government weather data
2. **Surf Conditions**: Sign up for a free Surfline API key
3. **News**: Already works! Pulls from Hawaii news websites
4. **Email Newsletter**: Sign up for Beehiiv.com (free plan available)

**Don't worry about these right away** - your website works great with the sample data!

---

## Understanding Your Website Files

### Important Folders

- **`src/app/`** - The main website pages
- **`src/components/`** - Reusable pieces (like the weather widget)
- **`src/services/`** - Code that gets data (weather, news, etc.)
- **`src/types/`** - Definitions of what data looks like

### Files You Might Want to Change

- **`src/app/layout.tsx`** - The main layout and title of your site
- **`src/components/widgets/`** - Individual sections (weather, surf, news)
- **`README.md`** - This instruction file!

---

## Common Questions

### "How much does this cost?"
- **GitHub**: Free
- **Vercel**: Free for personal projects (very generous limits)
- **Domain name**: $10-15 per year (optional)
- **API keys**: Most are free, some have paid tiers for heavy usage

### "Can I customize it?"
Yes! The code is yours to modify. Start with small changes like:
- Changing colors in the CSS files
- Updating text in the components
- Adding your own logo

### "What if I break something?"
Don't worry! You can always:
1. Download the original code again
2. Use GitHub's version history to undo changes
3. Ask for help in the GitHub Issues section

### "Do I need to know how to code?"
Not to get started! This guide gets you a working website. If you want to customize it later, you can learn a little at a time.

---

## Getting Help

### If You Get Stuck

1. **Read the error message carefully** - it often tells you what's wrong
2. **Try the troubleshooting steps** in this guide
3. **Google the error message** - someone else probably had the same problem
4. **Ask for help** by creating a "GitHub Issue" on your repository

### Learning More

If you want to understand the code better:
- **freeCodeCamp.org** - Free coding lessons
- **YouTube**: "Next.js tutorial for beginners"
- **MDN Web Docs** - Learn about HTML, CSS, and JavaScript

---

## Congratulations! 🎉

You now have a live website that shows real-time Hawaii information! 

**What you've accomplished:**
- ✅ Set up a development environment
- ✅ Downloaded and configured a complex web application
- ✅ Deployed it to the internet
- ✅ Made it accessible to anyone in the world

This is a huge achievement, especially if you're new to coding. Your website includes professional features like:
- Real-time data from government weather services
- Responsive design that works on phones and computers
- Search engine optimization
- Professional security features

**You're now a website owner!** 🌺

---

## What's Next?

1. **Share your website** with friends and family
2. **Customize it** to make it your own
3. **Learn more about web development** if you're interested
4. **Consider adding features** like user accounts or premium data sources

**Most importantly**: Have fun with it! You've built something really cool that helps people stay informed about Hawaii.

**Aloha and great job!** 🏄‍♂️🌴