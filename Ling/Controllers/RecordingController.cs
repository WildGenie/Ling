﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Ling.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.WindowsAzure.Storage.Blob;

// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Ling.Controllers
{
    public class RecordingController : Controller
    {
        IConfiguration _configuration;
        IHostingEnvironment _environment;

        public RecordingController(IConfiguration configuration, IHostingEnvironment env)
        {
            _configuration = configuration;
            _environment = env;
        }
        /// <summary>
        /// Displays all saved recordings
        /// </summary>
        /// <returns></returns>
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public async Task Create()
        {
            var data = HttpContext.Request.Form.Files[0];
            Blob blob = new Blob(_configuration["BlobStorageAccountName"], _configuration["BlobStorageKey"], _configuration);
            CloudBlobContainer container = await blob.GetContainer("soundrecording");

            //Send to blob storage
            //string envPath = $"{_environment.WebRootPath}\\images\\banner1.svg";
            string path = await CreatePath(data);
            blob.UploadFile(container, data.FileName, path);

            //Get Uri back from blob storage

            //Create Recording entry in app's DB
            return;
        }
    //TODO: 
    //Action that receives a clip?
    //Action that sends a clip to API, gets results, saves clip to DB, and displays results to user
    //etc.

        public async Task<string> CreatePath(IFormFile data)
        {
            //var filepath = Path.GetTempFileName();
            string filepath = System.IO.Path.GetTempPath() + Guid.NewGuid().ToString();
            using (var stream = new FileStream(filepath, FileMode.Create))
            {
                await data.CopyToAsync(stream);
            }
            return filepath;
        }

}
}
