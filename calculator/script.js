var pymChild = null;
var counter = 0;
var decile;
// inflation_data.js defines UI categories; repeated entries share one spending input.
var allCategories = inflation_data.map(function(d) {
  return d.cat_id;
}).filter(function(d, i, a) {
  return a.indexOf(d) == i;
});
prevSpend = 0;

function drawGraphic() {

  // Map spending-input IDs to pre-aggregated category IDs in the downloaded JSON.
  // Several UI inputs intentionally share a source series (for example, OOH and maintenance).
  var categoryIds = {
    foodhotdrinks: "1.1", spiritswinebeer: "1.2", tobacco: "1.3", personalcare: "1.4", nongrocery: "1.5",
    ooh: "2.1", maintenance: "2.1", rent: "2.2", counciltax: "2.3", electricitygasfuels: "2.4", water: "2.5",
    mobilephone: "3.1", internet: "3.2", vehicles: "4.1", petroldiesel: "4.2", othermotoring: "4.3",
    trainfares: "4.4", busfares: "4.5", electrical: "5.1", tv: "5.2", games: "5.3", entertainment: "5.4",
    pets: "5.5", gardening: "5.6", eatingout: "5.7", holidays: "5.8", otherleisure: "5.9",
    health: "A", education: "B", residentialcare: "C", childcare: "C", clothes: "D", furniture: "E",
    insurance: "F", other: "G"
  }
  // Rebuilt after each fetch and reused across recalculations, but not across page loads.
  var sourceCategories = {}
  loadData();
  getSize();

  quickcategories = dvc.quickcategories

  enablePageButtons();
  enableIncomePage();
  resetHousingCosts();
  addScreenReaderLabels();

  // Select the chart margins used by the current container width.
  function getSize() {
    someContainer = d3.select("#graphic-container");
    if (parseInt(someContainer.style("width")) < dvc.mobileBreakpoint) {
      size = "sm";
    } else if (parseInt(someContainer.style("width")) < dvc.mediumBreakpoint) {
      size = "md";
    } else {
      size = "lg";
    }
    lineMargin = dvc.lineChartMargin[size];
    barMargins = dvc.barChartMargin[size];
    propMargins = dvc.propChartMargin[size];
  } //end initialise


  // Wire the intro, quick/detailed steps, mode switches, and result navigation.
  // counter is the current step; results are shown after the final input step.
  function enablePageButtons() {

    d3.select("#startButton").on("click",function(){
      show(d3.select("#inputs0"))
      show(d3.select("#navbuttons"))
      // show(d3.select("#updateDiv"))
      hide(d3.select("#startPage"))
      pymChild.sendHeight();
      document.getElementById("graphic-container").scrollIntoView(true)
    })

    // d3.select(".button-select").style('display','block')

    option = d3.select("#option-button").property("value");

    d3.selectAll('.button-select').on('click',function(){
      option = d3.select(this).property("value");
      hide(d3.select('#launchpage'))
      show(d3.select('#inputs0'))
      show(d3.select('#navbuttons'))
      if (option != "superfast"){
        // hide(d3.select("#skipToEndBox"))
      }
      if (option == "superfast"){
        hide(d3.select("#intro-next-button"))
        d3.select("#income-description").text("What is your household's net income?")
        hide(d3.select("#averagespend"))
        hide(d3.select("#netincome"))
        show(d3.select("#net-income-input"))
        hide(d3.select(".sidebar"))
      }
      pymChild.sendHeight();
      document.getElementById("graphic-container").scrollIntoView(true)
    })

    // front page next button
    d3.select('button#intro-next-button').on('click', function() {
      show(d3.select(".button-back"))
      hide(d3.select('#inputs' + counter))
      if (counter == 0 & option == "detailed") {
        // disableSkipToEnd();
        if (d3.select('input[name="income"]:checked').node().value == "net-income") {
          // show(d3.select("#skipToEndBox"))
          decile = getDecile(d3.select("#netincome-input").property("value") * (d3.select("#netincome-time-period").property("value") / 12));
          d3.select("#runninginf-basedon").text("households with a similar income")
        } else {
          decile = 0
          // hide(d3.select("#skipToEndBox"))
          d3.select("#runninginf-basedon").text("the UK average")
        }
        addAverages(decile);
        addTooltips(decile);
        updateRunningTotal(decile);
        hide(d3.select('#inputs' + counter))
        counter++
        show(d3.select("#averagespend-disclaimer"))
        show(d3.select("#option-select"))
        show(d3.select("#monthlyexpenditure"))
        hide(d3.select("#currentinflation"))
        // show(d3.select("#inflationrate-summary"))
        show(d3.select('#inputs' + counter))
        pymChild.sendHeight();
        document.getElementById("graphic-container").scrollIntoView(true)
      } //if on front page and next is clicked remove skip to end button and replace with back button

      else if (counter == 0 & option == "quick"){
        // disableSkipToEnd();
        if (d3.select('input[name="income"]:checked').node().value == "net-income") {
          var decile = getDecile(d3.select("#netincome-input").property("value") * (d3.select("#netincome-time-period").property("value") / 12));
          // show(d3.select("#skipToEndBox"))
          d3.select("#runninginf-basedon").text("households with a similar income")
        } else {
          decile = 0
          // hide(d3.select("#skipToEndBox"))
          d3.select("#runninginf-basedon").text("the UK average")
        }
        addAverages(decile);
        addTooltips(decile);
        updateRunningTotal(decile);
        calculate(inflation, cpih_selected, decile, option)
        d3.select("#currentinflation").text(d3.format(".1f")(overall_inflation[0].pir)+"%*")
        // show(d3.select("#monthlyexpenditure"))
        // show(d3.select("#monthlyexpenditure"))
        show(d3.select("#averagespend-disclaimer"))
        show(d3.select("#inflationrate-summary"))
        show(d3.select("#currentinflation"))
        show(d3.select("#inputs-quick"))
        show(d3.select("#option-select"))
        if(housingsit == "mortgage"){
          hide(d3.select("#rent-quickinput"))
          show(d3.select("#ooh-quickinput"))
        }
        else if(housingsit == "rent"){
          hide(d3.select("#ooh-quickinput"))
          show(d3.select("#rent-quickinput"))
        }
        else if(housingsit == "nohcost"){
          hide(d3.select("#ooh-quickinput"))
          hide(d3.select("#rent-quickinput"))
        }
        else{
          show(d3.select("#ooh-quickinput"))
          show(d3.select("#rent-quickinput"))
        }
        counter++
        pymChild.sendHeight();
        document.getElementById("graphic-container").scrollIntoView(true)
      }

      else if (counter < 6 & option == "detailed") {
        if(!checkIfInputsAreBlank()){hide(d3.select("#calculateError"))}
        counter++;
        show(d3.select('#inputs' + counter))
        // show next page
        pymChild.sendHeight();
        document.getElementById("graphic-container").scrollIntoView(true)
      } else if (counter == 6 & option == "detailed") {
        inputtotal = 0;
        inflation_data.forEach(function(category) {
          value = +d3.select("#" + category.cat_id).property("value")
          inputtotal = inputtotal + value
        })
        if (!checkIfInputsAreBlank()) {
          d3.select("#calculateError").text("")
          hide(d3.select("#backtoDetailed"))
          hide(d3.select("#calculateError"))
          hide(d3.select("#averagespend-disclaimer"))
          showResults();
          pymChild.sendHeight()
          document.getElementById("graphic-container").scrollIntoView(true)
          calculate(inflation, cpih_selected, decile, option)
        } else {
          show(d3.select("#inputs" + counter))
          show(d3.select("#calculateError"))
          d3.select("#calculateError").text("You must enter some spending for this calculator to estimate your personal inflation rate")
          pymChild.sendHeight()
        }
      }
      else if (counter > 0 & option == "quick"){
        counter++
        showResults();
        hide(d3.select("#averagespend-disclaimer"))
        hide(d3.select("#inputs-quick"))
        show(d3.select("#backtoDetailed"))
        calculate(inflation, cpih_selected, decile, option)
        pymChild.sendHeight()
        document.getElementById("graphic-container").scrollIntoView(true)

      }
      // if we're at the end show the results

    });

    d3.selectAll("#option-button").on('click',function(){
      // d3.select(this).text(option.charAt(0).toUpperCase() + option.slice(1))
      // option = d3.select(this).property("value")
      if (option == "quick"){
        // d3.selectAll("#option-button-text").text("Too many categories?")
        // // hide(d3.select("#option-button-text2"))
        // d3.selectAll("#option-button").text("use our quick calculator")
        // d3.selectAll("#option-button-subtext2").text(" ")
        d3.select(this).property("value","detailed")
        option = d3.select(this).property("value")
        counter = 0
        // disableSkipToEnd();
        if (d3.select('input[name="income"]:checked').node().value == "net-income") {
          var decile = getDecile(d3.select("#netincome-input").property("value") * (d3.select("#netincome-time-period").property("value") / 12));
          // show(d3.select("#skipToEndBox"))
          d3.select("#runninginf-basedon").text("households with a similar income")
        } else {
          decile = 0
          // hide(d3.select("#skipToEndBox"))
          d3.select("#runninginf-basedon").text("the UK average")
        }
        quickcategories.forEach(function(category){
          var val = d3.select("#"+category+"-quick").property("value")
          d3.select("#"+category).property("value",val)
        })
        addAverages(decile);
        updateRunningTotal(decile);
        // hide(d3.select('#inputs' + counter))
        hide(d3.select('#inputs-quick'))
        counter++
        calculateSpending()
        show(d3.select("#monthlyexpenditure"))
        hide(d3.select("#inflationrate-summary"))
        show(d3.select('#inputs' + counter))
        pymChild.sendHeight();
        document.getElementById("graphic-container").scrollIntoView(true)
      }
      else{
        // d3.selectAll("#option-button-text").text("Want more accurate results?")
        // show(d3.select("#option-button-text2"))
        // d3.selectAll("#option-button").text("use our detailed calculator")
        // d3.selectAll("#option-button-subtext").text("to input your spending for more categories")
        hide(d3.select("#inputs"+counter))
        d3.select(this).property("value","quick")
        option = d3.select(this).property("value")
        counter = 0
        // disableSkipToEnd();
        if (d3.select('input[name="income"]:checked').node().value == "net-income") {
          var decile = getDecile(d3.select("#netincome-input").property("value") * (d3.select("#netincome-time-period").property("value") / 12));
          // show(d3.select("#skipToEndBox"))
          d3.select("#runninginf-basedon").text("households with a similar income")
        } else {
          decile = 0
          // hide(d3.select("#skipToEndBox"))
          d3.select("#runninginf-basedon").text("the UK average")
        }
        quickcategories.forEach(function(category){
          var val = d3.select("#"+category).property("value")
          d3.select("#"+category+"-quick").property("value",val)
        })
        addAverages(decile);
        updateRunningTotal(decile);
        // show(d3.select("#monthlyexpenditure"))
        hide(d3.select("#monthlyexpenditure"))
        show(d3.select("#inflationrate-summary"))
        show(d3.select("#inputs-quick"))
        for (var i = 0; i < 6; i++){
          hide(d3.select("#inputs" + i))
        }
        // show(d3.select("#option-button"))
        counter++
        pymChild.sendHeight();
        document.getElementById("graphic-container").scrollIntoView(true)
      }
    })

    d3.select("#results-detailed").on('click',function(){
      // hide(d3.select("#option-button-text2"))
      hide(d3.select("#results"))
      show(d3.select("#inputs1"))
      show(d3.select("#navbuttons"))
      show(d3.select("#option-select"))
      show(d3.select(".heading"))
      // show(d3.select("#intro-next-button"))
      // show(d3.select("#backButton-frontpage"))
      show(d3.select("#monthlyexpenditure"))
      pymChild.sendHeight();
      document.getElementById("graphic-container").scrollIntoView(true)
      // d3.select("#option-button").text("Click here to go back to our quick calculator")
      counter = 1
      option = "detailed"
      quickcategories.forEach(function(category){
        var val = d3.select("#"+category+"-quick").property("value")
        d3.select("#"+category).property("value",val)
      })
      calculateSpending()
    })


    // back button front page
    d3.select("button#backButton-frontpage").on('click', function() {
      if(!checkIfInputsAreBlank()){hide(d3.select("#calculateError"));pymChild.sendHeight();}
      hide(d3.select('#inputs-quick'))
      hide(d3.select('#inputs' + counter))
      if (counter == 1 | option == "quick") {
        // enableSkipToEnd();
        d3.select("#monthlyexpenditure").style("display", "none")
        d3.select("#inflationrate-summary").style("display", "none")
        d3.select("#option-select").style("display", "none")
        d3.select("#backButton-frontpage").style("display", "none")
        counter--;
      }
      if (counter > 1) {
        counter--;
      }
      // if (counter == 0){
      //   show(d3.select('#launchpage'));
      //   hide(d3.select('#inputs0'));
      //   pymChild.sendHeight();
      //   document.getElementById("graphic-container").scrollIntoView(true)
      // }
      show(d3.select('#inputs' + counter));
      pymChild.sendHeight();
      document.getElementById("graphic-container").scrollIntoView(true)
    });

    // back button for results page
    d3.select("button#backButton-results").on('click', function() {
      hideResults();
      show(d3.select("#averagespend-disclaimer"))
      // if(counter==0){
      //   hide(d3.select("#monthlyexpenditure"))
      //   hide(d3.select("#inflationrate-summary"))
      // }
      if (option == "detailed"){
        show(d3.select("#inputs"+counter))
        hide(d3.select("#inflationrate-summary"))
      }
      else if (option == "quick"){
        show(d3.select("#inputs-quick"))
        hide(d3.select("#monthlyexpenditure"))
      }
      else{
        d3.selectAll('input.spending').property("value",0)
        option = "quick"
        show(d3.select("#inputs-quick"))
        hide(d3.select("#monthlyexpenditure"))
        show(d3.select("#inflationrate-summary"))
      }
      pymChild.sendHeight();
      document.getElementById("graphic-container").scrollIntoView(true)
    })

    // back to start for results page
    d3.select("button#backToStartButton").on('click', function() {
      d3.selectAll('input.spending').property("value", 0)
      calculateSpending()
      // enableSkipToEnd()
      hideResults()
      hide(d3.select('#inputs' + counter));
      counter = 0;
      show(d3.select('#inputs' + counter))
      hide(d3.select("#backButton-frontpage"))
      hide(d3.select("#monthlyexpenditure"))
      hide(d3.select("#inflationrate-summary"))
      hide(d3.select("#option-select"))
      option = "quick"
      pymChild.sendHeight();
      document.getElementById("graphic-container").scrollIntoView(true)
    })

    d3.selectAll('input').on("click",function(){
      var value = d3.select(this).property("value")
      if (value == 0){
        d3.select(this).property("value","")
      }
    })

  }

  // Show or hide the income input; the selected value is applied on the next intro step.
  function enableIncomePage() {
    tippy('#netincome-question', {
      content: "This is the income of all the adults in your household (for example, earnings, benefits, pension), minus any taxes paid on that income (for example, income tax, national insurance).",
      theme: "ons",
      placement: "top"
    })
    d3.select("#net-income-radio").on('click', function() {
      show(d3.select('#net-income-input'))
      // d3.select("#skipToEndButton").property("disabled", false).classed("disabled", false)
      pymChild.sendHeight();
    })
    d3.select("#average-radio").on('click', function() {
      hide(d3.select('#net-income-input'))
      // d3.select("#skipToEndButton").property("disabled", true).classed("disabled", true)
      pymChild.sendHeight();
    })
  }

  // Switching tenure clears rent and owner-occupier inputs from both calculator modes.
  function resetHousingCosts(){
    d3.select("#mortgage-radio").on("click",function(){
      d3.select("#ooh-quick").property("value",0)
      d3.select("#rent-quick").property("value",0)
      d3.select("#ooh").property("value",0)
      d3.select("#rent").property("value",0)
    })
    d3.select("#rent-radio").on("click",function(){
      d3.select("#ooh-quick").property("value",0)
      d3.select("#rent-quick").property("value",0)
      d3.select("#ooh").property("value",0)
      d3.select("#rent").property("value",0)
    })
    d3.select("#mortgagerent-radio").on("click",function(){
      d3.select("#ooh-quick").property("value",0)
      d3.select("#rent-quick").property("value",0)
      d3.select("#ooh").property("value",0)
      d3.select("#rent").property("value",0)
    })
    d3.select("#nohcost-radio").on("click",function(){
      d3.select("#ooh-quick").property("value",0)
      d3.select("#rent-quick").property("value",0)
      d3.select("#ooh").property("value",0)
      d3.select("#rent").property("value",0)
    })
  }

  // Convert monthly household income into a 1-based decile; 0 means UK average elsewhere.
  function getDecile(income) {
    var decile = 0;
    // keep adding 1 to decile if income is still above current decile band. Also stop when we've exhausted deciles.
    while (decile < dvc.deciles.length && income > dvc.deciles[decile]["value"]) {
      decile++;
    }
    // decile is an index in the array, which starts at 0, but in practice deciles start from 1 so need to add 1 to adjust
    decile++;
    return decile;
  }

  // Build the comparison spends for the chosen decile and housing tenure.
  // The quick calculator uses these values for categories without a visible quick input.
  function addAverages(decile) {
    averages = []
    runningAvgTotal = 0
    var prevCat = "blank"
    housingsit = document.querySelector('input[name="housing"]:checked').value;
    inflation_data.forEach(function(category) {
      category_spend = deciles_data.filter(function(d) {
        return d.cat_id == category.cat_id
      })
      category_spend = Object.values(category_spend[0])
      if (category.cat_id != "childcare" & category.cat_id != "residentialcare" && category.cat_id != "tobacco" && category.cat_id != "pets"){
        if (category.cat_id == "rent" & (housingsit == "mortgage" | housingsit == "nohcost")){
          if(decile == 1){
            d3.selectAll("#" + category.cat_id + "-avgcompare")
            .text("Average spend not shown")
          } else{
          d3.selectAll("#" + category.cat_id + "-avgcompare")
            .text("Similar households spend: £0")
          }
        }
        else if (category.cat_id == "ooh" & (housingsit == "rent" | housingsit == "nohcost")){
          if(decile == 1){
            d3.selectAll("#" + category.cat_id + "-avgcompare")
            .text("Average spend not shown")
          } else{
          d3.selectAll("#" + category.cat_id + "-avgcompare")
            .text("Similar households spend: £0")
          }
        }
        else if (category.cat_id == "ooh" | category.cat_id == "rent"){
          if(decile == 1){
            d3.selectAll("#" + category.cat_id + "-avgcompare")
            .text("Average spend not shown")
          } else{
          d3.selectAll("#" + category.cat_id + "-avgcompare")
            .text("Similar households spend: £" + (d3.format(".0f")(category_spend[decile + 1] / (d3.select("#" + category.cat_id + "-time-period").property("value") / 12))))
          }
        }
        else if (decile == 0 & category.cat_id != "other") {
          d3.selectAll("#" + category.cat_id + "-avgcompare")
            .text("UK average spend: £" + (d3.format(".0f")(category_spend[decile+1] / (d3.select("#" + category.cat_id + "-time-period").property("value") / 12))))
        } else if (decile > 0 & category.cat_id != "other") {
          d3.selectAll("#" + category.cat_id + "-avgcompare")
            .text("Similar households spend: £" + (d3.format(".0f")(category_spend[decile+1] / (d3.select("#" + category.cat_id + "-time-period").property("value") / 12))))
        }
      }
      else{
        d3.selectAll("#" + category.cat_id + "-avgcompare")
          .text("Average spend not shown")
      }
      // else if (category.cat_id != "other") {
      //   d3.select("#" + category.cat_id + "-avgcompare")
      //     .text("Similar households spend on average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + category.cat_id + "-time-period").property("value") / 12))))
      //   }
      // console.log(category,category_spend[decile + 1])
      if (category.cat_id != prevCat & category.cat_id != "other"){
        if (category.cat_id == "rent" & (housingsit == "mortgage" | housingsit == "nohcost")){
          averages.push({key: category.cat_id, value: 0})
        }
        else if (category.cat_id == "ooh" & (housingsit == "rent" | housingsit == "nohcost")){
          averages.push({key: category.cat_id, value: 0})
        }
        else{
          averages.push({key: category.cat_id, value: +category_spend[decile + 1]})
          runningAvgTotal = runningAvgTotal + +category_spend[decile + 1]
        }
      }
      prevCat = category.cat_id
    })
  }

  // Populate spending-category help text, including tenure-specific caveats.
  function addTooltips(decile) {
    inflation_data.forEach(function(category) {
      d3.selectAll("#" + category.cat_id + "-question .question").text(category.category);
      if (category.description != "Add description here...") {
        console.log(decile, category.cat_id)
        tippy('#' + category.cat_id + '-question', {
          content: (decile == 1 && category.cat_id == "ooh") || (decile == 1 && category.cat_id == "rent") ? category.alt_description : category.description,
          theme: "ons",
          placement: "top"
        });
      } else {
        d3.selectAll("#" + category.cat_id + "-question .information").remove();
      }
    });

    tippy('#copyToClipboard', {
      placement: "top-start",
      content: "Link copied to clipboard",
      trigger: 'click',
      theme: "ons",
      duration: 1000
    });

  }

  // Detailed results require at least one nonzero spending input.
  function checkIfInputsAreBlank(){
    inputtotal = 0;
    inflation_data.forEach(function(category) {
      value = +d3.select("#" + category.cat_id).property("value")
      inputtotal = inputtotal + value
    })
    if(inputtotal==0){return true}else{return false};
  }

  // Fill labels for category inputs from the shared UI category definitions.
  function addScreenReaderLabels() {
    inflation_data.forEach(function(category) {
      d3.selectAll("#" + category.cat_id + "-label").text(category.category)
    })
  }

  // Swap the questionnaire for the results view without clearing entered spends.
  function showResults() {
    hide(d3.selectAll(".frontpage"));
    hide(d3.selectAll("#inputs0"));
    hide(d3.select("#monthlyexpenditure"))
    hide(d3.select(".heading"))
    show(d3.select("#results"));
    pymChild.sendHeight();
  }

  // Return to the questionnaire with the current spending inputs preserved.
  function hideResults() {
    show(d3.selectAll(".frontpage"));
    show(d3.select(".heading"))
    hide(d3.select("#results"));
  }

  // Compare entered spending with the UK average or similar-income households.
  function updateSpendComparison(id,decile){
    var category_spend = Object.values(deciles_data.filter(function(d){
      return d.cat_id == id
    })[0])

    if (id != "childcare" & id != "residentialcare"){
      if (option == "detailed"){
        d3.select("input#"+id).property("value",function(){
          return d3.select("input#"+id).property("value").replace(/^0+/, '')
        })
        input = +d3.select("#" + id).property("value") * d3.select("#" + id + "-time-period").property("value") / 12
        var idoption = ""
      }
      else{
        d3.select("input#"+id+"-quick").property("value",function(){
          return d3.select("input#"+id+"-quick").property("value").replace(/^0+/, '')
        })
        input = +d3.select("#" + id+"-quick").property("value") * d3.select("#" + id + "-time-period-quick").property("value") / 12
        var idoption = "-quick"
      }

      diff = ((input - category_spend[decile + 1]) / category_spend[decile + 1]) * 100
      if (diff > 0) {
        moreless = "more than"
      } else if (diff < 0) {
        moreless = "less than"
        diff = diff * -1
      } else if (diff == 0) {
        moreless = "Equal to"
      }

      if (input != 0 && diff == 0 && decile > 0 && id != "other") {
        d3.selectAll("#" + id + "-avgcompare").text(moreless + " similar households")
      } else if (input != 0 && diff == 0 && decile == 0 && id != "other") {
        d3.selectAll("#" + id + "-avgcompare").text(moreless + " the average")
      } else if (input != 0 && decile > 0 && id != "other") {
        d3.selectAll("#" + id + "-avgcompare").text(d3.format(".0f")(diff) + "% " + moreless + " similar households")
      } else if (input != 0 && decile == 0 && id != "other") {
        d3.selectAll("#" + id + "-avgcompare").text(d3.format(".0f")(diff) + "% " + moreless + " the average")
      } else if (input == 0 && decile > 0 && id != "other") {
        d3.selectAll("#" + id + "-avgcompare").text("Similar households spend: £" + (d3.format(".0f")(category_spend[decile+1] / (d3.select("#" + id + "-time-period" + idoption).property("value") / 12))))
      } else if(input == 0 && decile == 0 && id != "other" && id != "rent" && id != "ooh"){
        d3.selectAll("#" + id + "-avgcompare").text("UK average spend: £" + (d3.format(".0f")(category_spend[decile+1] / (d3.select("#" + id + "-time-period" + idoption).property("value") / 12))))
      } else if (input == 0 && decile == 0 && id != "other") {
        d3.selectAll("#" + id + "-avgcompare").text("Similar households spend: £" + (d3.format(".0f")(category_spend[decile+1] / (d3.select("#" + id + "-time-period" + idoption).property("value") / 12))))
      }
    }
  }

  // Refresh spend comparisons on input changes. Quick mode also recalculates
  // inflation immediately; detailed mode waits until the results step.
  function updateRunningTotal(decile) {
    d3.selectAll('input.spending').on('change', function() {
      calculateSpending();
      itemid = d3.select(this).attr("id").split("-")
      updateSpendComparison(itemid[0],decile)
      if (option == "quick"){
        prevInflation = overall_inflation[0].pir
        calculate(inflation, cpih_selected, decile, option)
        currInflation = overall_inflation[0].pir
        // d3.select("#currentinflation").transition().duration(1000).tween("text",d3.format(".1f")(overall_inflation[0].pir)+"%")
        d3.select("#currentinflation").transition().duration(1000).tween("text", function(d) {
          node = this
          numberTransition = d3.interpolateNumber(prevInflation, currInflation)
          return function(t) {
            d3.select(node).html(d3.format(",.1f")(numberTransition(t))+"%*")
            if (t == 1) {
              prevInflation = currInflation
            }
          }
        })
      }
    });

    // if (option == "detailed"){
      d3.selectAll('select.spending').on('change', function() {
        calculateSpending();
        itemid = d3.select(this).attr("id").split("-")
        updateSpendComparison(itemid[0],decile)
        // console.log($(this).val())
        var selected = d3.select(this).attr('id').split("-")
        var value = $(this).val()
        // console.log(selected)
        // var selectedtimeperiod = selected[0] + "-" + selected[1] + "-" selected[2]
        if (option == "quick"){
          $("#"+selected[0]+"-"+selected[1]+"-"+selected[2]+" option[value="+value+"]").attr('selected', 'selected');
        }
        if (option == "detailed"){
          $("#"+selected[0]+"-"+selected[1]+"-"+selected[2]+"-quick option[value="+value+"]").attr('selected', 'selected');
        }
      });
    // }
  }

  // function disableSkipToEnd() {
  //   hide(d3.select("#skipToEndBox"));
  //   show(d3.select("#backButton-frontpage"));
  // }
  //
  // function enableSkipToEnd() {
  //   show(d3.select("#skipToEndBox"));
  //   hide(d3.select("#backButton-frontpage"));
  // }

  // adapted from https://stackoverflow.com/questions/21070101/show-hide-div-using-javascript
  function hide(elements) {
    elements = elements._groups[0].length ? elements._groups[0] : [elements._groups[0]];
    for (var index = 0; index < elements.length; index++) {
      elements[index].style.display = 'none';
    }
  }

  function show(elements, specifiedDisplay) {
    var computedDisplay, element, index;

    elements = elements._groups[0].length ? elements._groups[0] : [elements._groups[0]];
    for (index = 0; index < elements.length; index++) {
      element = elements[index];

      // Remove the element's inline display styling
      element.style.display = '';
      computedDisplay = window.getComputedStyle(element, null).getPropertyValue('display');

      if (computedDisplay === 'none') {
        element.style.display = specifiedDisplay || 'block';
      }
    }
  }

  // Animate the total of the detailed monthly spending inputs.
  function calculateSpending() {
    totalspending = allCategories.reduce(function(prev, curr) {
      return prev + spendXfreq(curr)
    }, 0)

    d3.select("#currentSpend").transition().duration(1000).tween("text", function(d) {
      node = this
      numberTransition = d3.interpolateNumber(prevSpend, totalspending)
      return function(t) {
        d3.select(node).html("£" + d3.format(",.0f")(numberTransition(t)))
        if (t == 1) {
          prevSpend = totalspending
        }
      }
    })
  }

  // Convert the selected payment frequency to a monthly amount.
  function spendXfreq(item) {
    return d3.select("input#" + item).property('value') * d3.select("select#" + item + "-time-period").property('value') / 12
  }

  // Combine current monthly spends with each category's annual inflation rate.
  // sourceCategories is prepared at load time; spending and decile averages remain live.
  function calculate(data, cpih, decile, option) {
    var total = 0
    var total_change = 0
    pir = 0
    category_data = {}
    //loop through each category
    Object.keys(categoryIds).forEach(function(category) {
      var months = sourceCategories[categoryIds[category]]
      category_data[category] = {}
      quickcategories = dvc.quickcategories
      if (option == "quick" && !quickcategories.includes(category) && category != "other") {
        var averageSpend = averages.filter(function(d) {
          return d.key == category
        })[0].value
      }
      //loop through each month
      for (var i = 0; i < months.length; i++) {
        if (option == "detailed" | option == "superfast"){
          var input = (d3.select("#" + category).property("value") * d3.select("#" + category + "-time-period").property("value")) / 12
        }
        else if (option == "quick"){
          if(quickcategories.includes(category) == true){
            var input = (d3.select("#" + category + "-quick").property("value") * d3.select("#" + category + "-time-period-quick").property("value")) / 12
          }
          else if(quickcategories.includes(category) == false & category != "other"){
              var input = averageSpend
            }
          else{
            var input = 0
          }
        }
        // Reverse the annual increase to estimate last year's spend at today's basket size.
        var inflation_rate = months[i].annualRate
        var previous_spend = (input / (1 + (inflation_rate / 100)))
        var change = input - previous_spend
        category_data[category][i] = {
          date: months[i].date,
          input: input,
          inflation_rate: inflation_rate,
          change: change,
          previous_spend: previous_spend,
          weight: 0,
          weighted_index: 0
        }
      }
    })

    averages.forEach(function(d){
      category = d.key
      selected_infdata = inflation_data.filter(function(infdata){return infdata.cat_id == d.key})
      d.category = selected_infdata[0].category
      d.inflation_rate = sourceCategories[categoryIds[category]][0].annualRate
      d.change = d.value - (d.value / (1 + (d.inflation_rate / 100)))
      d.previous_spend = d.value - d.change
    })

    // Sum monthly changes, then compare them with last year's total to obtain PIR.
    // Index 0 is the latest month; the charts expect 60 months in this order.
    overall_inflation = []
    for (i = 0; i < sourceCategories[categoryIds.foodhotdrinks].length; i++) {
      var total = 0
      var total_change = 0
      var pir = 0
      Object.keys(category_data).forEach(function(category) {
        total = total + category_data[category][i].input
        total_change = total_change + category_data[category][i].change
        // if (i == 0){
        //   console.log(category,category_data[category][i].change)
        // }
      })
      pir = (total_change/(total-total_change))*100
      Object.keys(category_data).forEach(function(category) {
        // console.log(category_data[category][i])
        // Each category's chart contribution is its share of the total spend change.
        category_data[category][i].weight = category_data[category][i].change/total_change
        category_data[category][i].weighted_index = pir*category_data[category][i].weight
        // category_data[category][i].weight = category_data[category][i].input / total
        // category_data[category][i].weighted_index = category_data[category][i].inflation_rate * category_data[category][i].weight
        // pir = pir + category_data[category][i].weighted_index
        overall_inflation[i] = {
          series: "overall_inflation",
          date: category_data[category][i].date,
          total: total,
          total_change: total_change,
          pir: pir
        }
      })
    }

    console.log("Inflation calculation using imported data", {
      data: data,
      latestInflation: overall_inflation[0]
    })

    // Only populate the results and charts once the user reaches the results state.
    if (counter > 1 | option == "superfast"){

      d3.select("#personalInflation").text(d3.format(".1f")(overall_inflation[0].pir) + "%")
      d3.select("#inflationDifference").text(d3.format(".1f")(overall_inflation[0].pir - cpih[0].value) + " percentage points")
      d3.select("#overunder").text(function() {
        return overall_inflation[0].pir - cpih[0].value > 0 ? "over" : "under"
      })
      d3.select("#currentInflationRate").text(d3.format(".1f")(cpih[0].value) + "%")

      d3.select("#increaseMonthlySpend").text("£" + d3.format(".0f")(overall_inflation[0].total_change))
      d3.selectAll(".dateOneYearPrior").text(d3.timeFormat("%B %Y")(overall_inflation[12].date))
      d3.selectAll(".dateFiveYearsPrior").text(d3.timeFormat("%B %Y")(overall_inflation[59].date))
      d3.selectAll(".currentDate").text(d3.timeFormat("%B %Y")(overall_inflation[0].date))

      drawLineChart(overall_inflation, cpih)

      // Average-spend proportions are recomputed once for each results calculation.
      categoryByWeight = []
      runningAvgTotal = 0
      averages.forEach(function(category){
        runningAvgTotal = runningAvgTotal + category.value
      })
      averages.forEach(function(category){
        category.proportion = +d3.format(".3f")(category.value/runningAvgTotal)
        category.weighted_index = category.proportion * category.inflation_rate
      })

      Object.keys(category_data).forEach(function(category) {
        // if ((category == "rent" | category == "ooh") & category_data[category][0].input == 0){
        //   averages.filter(function(d){return d.key == category})[0].value = 0
        // }
        var foo = category_data[category][0]
        foo.category = inflation_data.filter(function(d) {
          return d.cat_id == category
        })[0].category
        foo.cat_id = category
        categoryByWeight.push(foo)
      })
      categoryByWeight.sort(function(a, b) {
        return b.weight - a.weight;
      })

      categoryByIncrease = []

      Object.keys(category_data).forEach(function(category) {
        var foo = category_data[category][0]
        foo.category = inflation_data.filter(function(d) {
          return d.cat_id == category
        })[0].category
        foo.cat_id = category
        categoryByIncrease.push(foo)
      })
      categoryByIncrease.sort(function(a, b) {
        return b.change - a.change;
      })

      quickcats_byInc = []

      if(option == "quick"){
        categoryByIncrease.forEach(function(d){
          if(dvc.quickcategories.includes(d.cat_id)){
            quickcats_byInc.push(d)
          }
        })
        categoryByIncrease = quickcats_byInc
      }

      categoryByIncrease_slice = categoryByIncrease.slice(0, 5)

      categoryByIncrease_slice.reverse()
      categoryByIncrease.reverse()

      categoryByWeight = categoryByWeight.sort(function(a, b){
        return b.weighted_index - a.weighted_index
      })

      // averages = categoryByWeight.sort(function(a, b){
      //   return b.weighted_index - a.weighted_index
      // })

      proportiondata = []
      ranks_data = {}
      proportiondata.push({key: "Your inflation", data: categoryByWeight})
      total_inf = 0
      // if (option == "quick"){
      //   proportiondata[0].data.forEach(function(d, i){
      //     if (dvc.quickcategories.includes(d.cat_id) == false){
      //       console.log(d.cat_id,"splice")
      //       proportiondata[0].data.push(proportiondata[0].data[i].splice);
      //     }
      //   })
      //   console.log(proportiondata[0].data)
      // }
      proportiondata[0].data.forEach(function(d, i){
        if (i < dvc.prop_colour_palette.length){
          d.propid = d.cat_id
          d.propname = d.category
          d.previous_total = total_inf
          total_inf = total_inf + d.weighted_index
          d.running_total = total_inf
          d.rank = i+1
          ranks_data[d.cat_id]= d.rank
        }
        else{
          var otherprop = proportiondata[0].data[dvc.prop_colour_palette.length]
          if (i == dvc.prop_colour_palette.length){
            otherprop.previous_total = total_inf
            otherprop.propid = "allotherspend"
            otherprop.propname = "All other categories"
          }
          total_inf = total_inf + d.weighted_index
          otherprop.running_total = total_inf
          if (i > dvc.prop_colour_palette.length){
            otherprop.weighted_index = otherprop.weighted_index + d.weighted_index
          }
          otherprop.rank = i+1
          ranks_data[d.cat_id]= otherprop.rank
        }
      })

      proportiondata[0].data = proportiondata[0].data.splice(0,6)

      averages.forEach(function(d){
        d.rank = ranks_data[d.key]
      })

      averages.sort(function(a ,b){
        return a.rank - b.rank
      })

      total_inf = 0
      averages.forEach(function(d){
        d.previous_total = total_inf
        total_inf = total_inf + d.weighted_index
        d.running_total = total_inf
      })

      // proportiondata.push({key: "Similar household", data: averages})

      similarhh_ir = 0

      averages.forEach(function(category){
        similarhh_ir = similarhh_ir + category.weighted_index
      })

      if (option == "superfast"){
        show(d3.select("#estimated-legend"))
      }
      else{
        hide(d3.select("#estimated-legend"))
      }

      baroption = "condensed"
      drawProportionChart(proportiondata)
      drawBarChart(categoryByIncrease_slice,baroption)

      d3.select("#seemore-button").on("click",function(){
        if (baroption == "condensed"){
          baroption = "expanded"
          drawBarChart(categoryByIncrease,baroption)
          d3.select("#seemore").text("◄ See less ")
          pymChild.sendHeight();
        }
        else if (baroption == "expanded"){
          baroption = "condensed"
          drawBarChart(categoryByIncrease_slice,baroption)
          d3.select("#seemore").text("► See more ")
          pymChild.sendHeight();
        }
      })
    }

  } //end calculate function

  // Redraw the stacked contribution chart from the latest category results.
  // Clicking a segment updates the selected category's explanatory text.
  function drawProportionChart(data){
    var graphic = d3.select('#proportionchart');
    graphic.selectAll("*").remove();
    // if (baroption == "condensed"){
    height = 100;
    var chart_width = parseInt(d3.select(".results-input").style("width")) - propMargins.left - propMargins.right;

    d3.select("#propChart-alttext")
      .text(
        "This chart shows how each spending category contributes to your overall inflation rate " +
        ". The biggest contributor to your overall inflation rate was " + data[0].data[0].category +
        " which increased your total monthly spend by " + d3.format(',.1f')(data[0].data[0].weighted_index) + "%" +
        ". The second contributor to your overall inflation rate was " + data[0].data[1].category +
        " which increased your total monthly spend by " + d3.format(',.1f')(data[0].data[1].weighted_index) + "%"  +
        ". The third contributor to your overall inflation rate was " + data[0].data[2].category +
        " which increased your total monthly spend by " + d3.format(',.1f')(data[0].data[2].weighted_index) + "%"
      )

    var x = d3.scaleLinear()
      .range([0, chart_width]);

    var y = d3.scaleBand()
      .range([0, height])
      .paddingInner(0.5);

    max_inf = d3.max([overall_inflation[0].pir,similarhh_ir])

    x.domain([0, Math.ceil(max_inf)])
    y.domain(data.map(function(d) {
      return d.key;
    }));

    var xAxis = d3.axisBottom(x).tickSize(-y.bandwidth()-20).tickPadding(10).ticks(5).tickFormat(function(d){return d+"%"})
      // .tickValues([0]).tickFormat("");
    var yAxis = d3.axisLeft(y).tickSize(0);

    var svg = d3.select('#proportionchart').append('svg')
      .attr("width", chart_width + propMargins.left + propMargins.right)
      .attr("height", height + propMargins.top + propMargins.bottom)
      .append("g")
      .attr("transform", "translate(" + propMargins.left + "," + propMargins.top + ")");

    // svg.append('g')
    //   .attr('class', 'y axis')
    //   .call(yAxis).selectAll("text").each(function(d, i) {
    //     d3.select(this).call(wrap, propMargins.left - 10);
    //   });

    svg.append('g')
      .attr('class', 'x axis')
      .attr("transform", "translate(" + 0 + "," + (y.bandwidth()+30) + ")")
      .call(xAxis)
      .selectAll("line")
      .style("stroke","#CCC")

    // svg.append('g')
    //   .attr('class', 'x axis')
    //   .attr("transform", "translate(" + 0 + "," + (height) + ")")
    //   .call(xAxis)
    //   .selectAll("line")
    //   .style("stroke","#CCC")
    data.forEach(function(d){
      svg.append('g')
        .selectAll('rect').data(d.data)
        .enter()
        .append('rect')
        .attr('class','propDataRect')
        .attr('id',function(propd){
          if (d.key == "Your inflation"){
            return 'propDataRect-'+propd.propid
          }
          else{
            return 'propDataRect-'+propd.key
          }
        })
        .attr('x', function(propd){
          return x(propd.previous_total)
        })
        .attr('y', y(d.key))
        .attr('height', y.bandwidth()-5)
        .attr('width', function(propd) {
          if (propd.change >= 0){
            return x(propd.weighted_index)
          }
          else{
            return 0
          }
        })
        .attr('fill', function(d, i){
          if (i < dvc.prop_colour_palette.length){
            return dvc.prop_colour_palette[i]
          }
          else{
            return "#CCC"
          }
        })
        .style('stroke', function(d, i){
          if (i == 0){
            return "#FBC900"
          }
          else{
            return "#CCC"
          }
        })
        .style('stroke-width', function(d, i){
          if (i == 0){
            return 3
          }
          else{
            return 0
          }
        })
        .attr("tabindex",0)
        // d3.selectAll(".propDataRect")


        d3.selectAll(".propDataRect")
          .on("click",handleMouseClick)
          .on("keypress",handleMouseClick)

        function handleMouseClick(d,i){
          var selectedCat = d.propid
          if (typeof selectedCat == 'undefined'){
            var selectedCat = d.key
            i = i - data[0].data.length
          }
          d3.selectAll(".propDataRect").style("stroke-width",0)
          d3.selectAll("#propDataRect-"+selectedCat).style("stroke-width",3).style("stroke","#FBC900").moveToFront()
          d3.select("#selectedProp").text(data[0].data[i].propname.charAt(0).toLowerCase()+data[0].data[i].propname.slice(1)).style("color",dvc.prop_colour_palette_text[i])
          d3.select("#selectedPropVal").text(d3.format(".1f")(data[0].data[i].weighted_index)+"%")
          d3.select("#infProp").text(d3.format(".1f")((data[0].data[i].weighted_index/overall_inflation[0].pir)*100)+"%")
        }

        svg.append('text')
          .attr('class','propgraph-cat-label')
          .text(d.key)
          .attr('transform','translate(5,'+(y(d.key)-5)+')')
      })

      var firstcat = data[0].data[0]


      // var textnode = svg.append('text')
      //   .attr('class','propgraph-label row-major')
      //   .attr('transform','translate('+(chart_width/2)+','+(y("Your inflation")+y.bandwidth()+70)+')')
        // .text("Spend on "+(firstcat.category.charAt(0).toLowerCase()+firstcat.category.slice(1))+" caused your monthly spend to increase by "+d3.format(".1f")(firstcat.weighted_index)+"%")

      d3.select('#selectedProp').text((firstcat.category.charAt(0).toLowerCase()+firstcat.category.slice(1))).style("color",dvc.prop_colour_palette[0]).style("font-weight",700)
      d3.select('#selectedPropVal').text(d3.format(".1f")(firstcat.weighted_index)+"%").style("font-weight",700)
      d3.select('#infProp').text(d3.format(".1f")((firstcat.weighted_index/overall_inflation[0].pir)*100)+"%").style("font-weight",700)

      // textnode.append('tspan').attr('id','proptext1').text("Spend on ")
      // textnode.append('tspan').attr('id','selectedProp').text((firstcat.category.charAt(0).toLowerCase()+firstcat.category.slice(1))).style("fill",dvc.prop_colour_palette[0]).style("font-weight",700)
      // textnode.append('tspan').attr('id','proptext2').text(" have caused your average monthly costs to increase by ")
      // textnode.append('tspan').attr('id','selectedPropVal').text(d3.format(".1f")(firstcat.weighted_index)+"%").style("font-weight",700)
      // textnode.append("br")
      // textnode.append('tspan').attr('id','proptext3').text("This accounted for ").attr('dy',20).attr('x',0)
      // textnode.append('tspan').attr('id','infProp').text(d3.format(".1f")((firstcat.weighted_index/overall_inflation[0].pir)*100)+"%").style("font-weight",700)
      // textnode.append('tspan').attr('id','proptext4').text(" of your total inflation rate")


      // var firstcat_avg = data[1].data[0]
      // var textnode2 = svg.append('text')
      //   .attr('class','propgraph-label')
      //   .attr('transform','translate('+(chart_width/2)+','+(height+40)+')')
      //
      // textnode2.append('tspan').text("In comparison, spend on ")
      // textnode2.append('tspan').attr('id','selectedProp_avg').text((firstcat_avg.category.charAt(0).toLowerCase()+firstcat.category.slice(1))).style("fill",dvc.prop_colour_palette[0]).style("font-weight",700)
      // textnode2.append('tspan').text(" caused similar households monthly costs to increase by ")
      // textnode2.append('tspan').attr('id','selectedPropVal_avg').text(d3.format(".1f")(firstcat_avg.weighted_index)+"%").style("font-weight",700)
      // textnode2.append("br")
      // textnode2.append('tspan').text("This accounted for ").attr('dy',20).attr('x',0)
      // textnode2.append('tspan').attr('id','infProp_avg').text(d3.format(".1f")((firstcat_avg.weighted_index/overall_inflation[0].pir)*100)+"%").style("font-weight",700)
      // textnode2.append('tspan').text(" of their total inflation rate")
      //



      // var points = [firstcat.]
      //
      // svg.append('path')
      //   .attr('d',points)


  }

  // Redraw either the five-category summary or the expanded spending-change bars.
  function drawBarChart(data, baroption) {
    // console.log(data)
    var graphic = d3.select('#barchart');
    graphic.selectAll("*").remove();
    if (baroption == "condensed"){
      height = 250;
      textpos = -12
    }
    else if (baroption == "expanded"){
      if (size == "sm"){
        height = 60*data.length;
      }
      else if (size == "md"){
        height = 45*data.length
      }
      else{
        height = 45*data.length;
      }
      textpos = -5
    }
    var chart_width = parseInt(d3.select(".results-input").style("width")) - barMargins.left - barMargins.right;

    d3.select("#barChart-alttext")
    .text(
      "This bar chart show the top 5 categories where we estimate your spending has increased and the amount your spend on each has increased by"
      + "Your biggest increase was for " + data[0].category + " which increased by £" + d3.format(',.0f')(data[0].change)
      + ". Your second biggest increase was for " + data[1].category + " which increased by £" + d3.format(',.0f')(data[1].change)
      + ". Your third biggest increase was for " + data[2].category + " which increased by £" + d3.format(',.0f')(data[2].change)
      + ". Your forth biggest increase was for " + data[3].category + " which increased by £" + d3.format(',.0f')(data[3].change)
      + ". Your fifth biggest increase was for " + data[4].category + " which increased by £" + d3.format(',.0f')(data[4].change)
    )

    var x = d3.scaleLinear()
      .range([0, chart_width]);

    var y = d3.scaleBand()
      .range([height, 0])
      .paddingInner(0.4);

    var maxX = d3.max(data,function(d){return d.input})

    x.domain([0, d3.max(data, function(d) {
      return d.input;
    })]);
    y.domain(data.map(function(d) {
      return d.category;
    }));
    if (size == "sm" | size == "md"){
      var xAxis = d3.axisBottom(x).tickSize(-height).tickPadding(20).tickFormat(function(d){return "£"+d}).ticks(2)
    }
    else{
      var xAxis = d3.axisBottom(x).tickSize(-height).tickPadding(20).tickFormat(function(d){return "£"+d}).ticks(5)
    }

      // .tickValues([0]).tickFormat("");
    var yAxis = d3.axisLeft(y).tickSize(0);


    var svg = d3.select('#barchart').append('svg')
      .attr("width", chart_width + barMargins.left + barMargins.right)
      .attr("height", height + barMargins.top + barMargins.bottom)
      .append("g")
      .attr("transform", "translate(" + barMargins.left + "," + barMargins.top + ")");

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis).selectAll("text").each(function(d, i) {
        d3.select(this).call(wrap, barMargins.left - 10);
      });

    svg.append('g')
      .attr('class', 'x axis')
      .attr("transform", "translate(" + 0 + "," + (height) + ")")
      .call(xAxis)
      .selectAll("line")
      .style("stroke","#CCC")

    // svg.append('g')
    //   .attr('class','xAxisLabel')
    //   .append('text')
    //   .attr("transform", "translate(" + (chart_width-80) + "," + (height+10) + ")")
    //   .attr("text-anchor","end")
    //   .text("£")


    svg.append('g')
      .selectAll('rect').data(data)
      .enter()
      .append('rect')
      .attr('x', x(0))
      .attr('y', function(d) {
        return y(d.category)
      })
      .attr('height', y.bandwidth())
      .attr('width', function(d) {
        if(d.change >= 0){
          return x(d.previous_spend)
        }
        else{
          return x(d.previous_spend+d.change)
        }
      })
      .attr('fill', "#206095")

    svg.append('g')
      .selectAll('rect').data(data)
      .enter()
      .append('rect')
      .attr('x', function(d) {
        if(d.change >= 0){
          return x(d.previous_spend)
        }
        else{
          return x(d.previous_spend+d.change)
        }
      })
      .attr('y', function(d) {
        return y(d.category)
      })
      .attr('height', y.bandwidth())
      .attr('width', function(d) {
        if(d.change >= 0){
          return x(d.change)
        }
        else{
          return x(-d.change)
        }
      })
      .attr('fill', function(d){
        if (d.change >= 0){
          return "#A6BFD5"
        }
        else{
          return "#902092"
        }
      })

    //add text label
    svg.append('g')
      .selectAll('text.value')
      .data(data)
      .enter()
      .append('text')
      .attr('x', function(d) {
        return x(d.input)
      })
      .attr('y', function(d) {
        if (d.input == 0){
          return y(d.category)+y.bandwidth()/2 +5
        }
        else{
          return y(d.category)+y.bandwidth()/2 -5
        }
      })
      .attr('dx',5)
      .attr('text-anchor','start')

      .attr('fill',function(d){
        if (d.change >= 0){
          return "#206095"
        }
        else {
          return "#902092"
        }
      })
      .text(function(d) {
        if ((option == "quick" & dvc.quickcategories.includes(d.cat_id) == false) | option == "superfast"){
          if (d.input == 0){
            return "N/A (No spending)"
          }
          else if (d.change > 0){
            return "▲ £" + d3.format(",.0f")(d.change)+"*"
          }
          else if (d.change < 0){
            return "▼ £" + d3.format(",.0f")(d.change)+"*"
          }
          else{
            return "No change"
          }
        }
        else{
          if (d.input == 0){
            return "N/A (No spending)"
          }
          else if (d.change > 0){
            return "▲ £" + d3.format(",.0f")(d.change)
          }
          else if (d.change < 0){
            return "▼ £" + d3.format(",.0f")(d.change)
          }
          else{
            return "No change"
          }
        }
        })
      .attr("font-weight",700)

    //add text label
    svg.append('g')
      .selectAll('text.value')
      .data(data)
      .enter()
      .append('text')
      .attr('x', function(d) {
        return x(d.input)
      })
      .attr('y', function(d) {
        return y(d.category)+y.bandwidth()/2 -5
      })
      .attr('dx',5)
      .attr('dy', 20)
      .attr('text-anchor','start')

      .attr('fill',function(d){
        if (d.change >= 0){
          return "#206095"
        }
        else {
          return "#902092"
        }
      })
      .text(function(d) {
        if (d.change != 0){
          return "(+"+ d3.format(",.0f")(d.inflation_rate)+"%)"
        }
        else{
          return ""
        }
      })

      //add text label
      svg.append('g')
        .selectAll('text.value')
        .data(data)
        .enter()
        .append('text')
        .attr('x', function(d) {
          return 0
        })
        .attr('y', function(d) {
          return y(d.category)+y.bandwidth()
        })
        .attr('dx',10)
        .attr('dy', textpos)
        .attr('text-anchor','start')

        .attr('fill',"white")
        .text(function(d) {
          if ((option == "quick" & dvc.quickcategories.includes(d.cat_id) == false) | option == "superfast"){
            if (size == "lg"){
              if (d.previous_spend > maxX*0.1){
                return "£"+d3.format(",.0f")(d.input)+"*"
              }
              else{
                return " "
              }
            }
            // else if (size == "md"){
            //   if (d.previous_spend > maxX*0.25){
            //     return "£"+d3.format(",.0f")(d.input)+"*"
            //   }
            //   else{
            //     return " "
            //   }
            // }
            else{
              if (d.previous_spend > maxX*0.4){
                return "£"+d3.format(",.0f")(d.input)+"*"
              }
              else{
                return " "
              }
            }
          }
          else{
            if (size == "lg"){
              if (d.previous_spend > maxX*0.1){
                return "£"+d3.format(",.0f")(d.input)
              }
              else{
                return " "
              }
            }
            else if (size == "md"){
              if (d.previous_spend > maxX*0.25){
                return "£"+d3.format(",.0f")(d.input)
              }
              else{
                return " "
              }
            }
            else{
              if (d.previous_spend > maxX*0.4){
                return "£"+d3.format(",.0f")(d.input)
              }
              else{
                return " "
              }
            }
          }
        })
        // .attr("font-weight",700)

  } // ends drawBarChart

  // Redraw the five-year personal-rate and CPIH lines on a shared date/percent scale.
  function drawLineChart(overall_inflation, cpih) {
    var graphic = d3.select('#graphic');
    graphic.selectAll("*").remove();
    var height = 250 - lineMargin.top - lineMargin.bottom
    var width = parseInt(d3.select(".results-input").style("width"));
    var chart_width = width - lineMargin.left - lineMargin.right

    d3.select("#lineChart-alttext")
      .text("This line chart shows your estimated inflation rate over the past 5 years."
        + "In " + d3.timeFormat("%B %Y")(overall_inflation[0].date) + " your inflation rate was "
        + d3.format(",.1f")(overall_inflation[0].pir) + " while CPIH was " + d3.format(",.1f")(overall_inflation[0].pir)
        + ". In " + d3.timeFormat("%B %Y")(overall_inflation[12].date) + " your inflation rate was "
        + d3.format(",.1f")(overall_inflation[12].pir) + " while CPIH was " + d3.format(",.1f")(overall_inflation[12].pir)
        + ". In " + d3.timeFormat("%B %Y")(overall_inflation[24].date) + " your inflation rate was "
        + d3.format(",.1f")(overall_inflation[24].pir) + " while CPIH was " + d3.format(",.1f")(overall_inflation[24].pir)
        + ". In " + d3.timeFormat("%B %Y")(overall_inflation[36].date) + " your inflation rate was "
        + d3.format(",.1f")(overall_inflation[36].pir) + " while CPIH was " + d3.format(",.1f")(overall_inflation[36].pir)
        + ". In " + d3.timeFormat("%B %Y")(overall_inflation[48].date) + " your inflation rate was "
        + d3.format(",.1f")(overall_inflation[48].pir) + " while CPIH was " + d3.format(",.1f")(overall_inflation[48].pir)
      )

    var x = d3.scaleTime()
      .range([0, chart_width]);

    var y = d3.scaleLinear()
      .range([height, 0]);

    x.domain(d3.extent(overall_inflation, function(d) {
      return d.date;
    }));

    var xAxis = d3.axisBottom(x).ticks(dvc.x_num_ticks[size])


    var yAxis = d3.axisLeft(y).tickSize(-chart_width).ticks(5).tickFormat(function(d){return d+"%"});

    var line = d3.line()
      .defined(function(d) {
        return d.pir != null;
      }) // Skip missing values rather than joining gaps in the series.
      .curve(d3.curveLinear)
      .x(function(d) {
        return x(d.date);
      })
      .y(function(d) {
        return y(d.pir);
      });

    var line2 = d3.line()
      .defined(function(d) {
        return d.value != null;
      }) // Skip missing CPIH observations rather than joining gaps.
      .curve(d3.curveLinear)
      .x(function(d) {
        return x(d.date);
      })
      .y(function(d) {
        return y(d.value);
      });


    lines = d3.nest()
      .key(function(d) {
        return d.series
      })
      .entries(overall_inflation)

    var cpih_line = d3.nest()
      .key(function(d) {
        return d.sourceDataset
      })
      .entries(cpih)

    maxy = d3.max([d3.max(cpih_line[0].values, function(d) {
      return d.value
    }), d3.max(lines[0].values, function(d) {
      return d.pir
    })])
    miny = d3.min([d3.min(cpih_line[0].values, function(d) {
      return d.value
    }), d3.min(lines[0].values, function(d) {
      return d.pir
    })])

    var yDomain = [d3.min([0, miny]), maxy]

    y.domain(yDomain).nice();

    var svg = d3.select('#graphic').append('svg')
      .attr("id", "chart")
      .style("background-color", "#fff")
      .attr("width", chart_width + lineMargin.left + lineMargin.right)
      .attr("height", height + lineMargin.top + lineMargin.bottom)
      .append("g")
      .attr("transform", "translate(" + lineMargin.left + "," + lineMargin.top + ")");

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      // .append('text')
      // .attr('dy', -10)
      // .text("%");

    //create x axis, if y axis doesn't start at 0 drop x axis accordingly
    svg.append('g')
      .attr('class', 'x axis')
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    //create lines
    svg.append('g').attr('id', 'cpih').selectAll('path')
      .data(d3.entries(cpih_line[0]))
      .enter()
      .append('path')
      .style("stroke", dvc.lineColours[0])
      .style("fill", 'none')
      .style("stroke-width", 3.5)
      .style("stroke-linecap", 'round')
      .style("stroke-linejoin", 'round')
      .attr('d', function(d) {
        return line2(d.value);
      });

    //create lines
    svg.append('g').attr('id', "pir").selectAll('path')
      .data(d3.entries(lines[0]))
      .enter()
      .append('path')
      .style("stroke", dvc.lineColours[1])
      .style("fill", 'none')
      .style("stroke-width", 3.5)
      .style("stroke-linecap", 'round')
      .style("stroke-linejoin", 'round')
      .attr('d', function(d) {
        return line(d.value);
      });


    // add dots
    svg.append('g').selectAll('circle.cpih')
      .data([cpih_line[0].values[0]])
      .enter()
      .append('circle')
      .attr('cy', function(d) {
        return y(d.value)
      })
      .attr('cx', function(d) {
        return x(d.date)
      })
      .attr('r', 5)
      .attr('fill', dvc.lineColours[0])

    svg.append('g').selectAll('circle.pir')
      .data([lines[0].values[0]])
      .enter()
      .append('circle')
      .attr('cy', function(d) {
        return y(d.pir)
      })
      .attr('cx', function(d) {
        return x(d.date)
      })
      .attr('r', 5)
      .attr('fill', dvc.lineColours[1])

  }

  // Load the category rates and headline CPIH independently. Both must finish before
  // calculations can compare a personal rate with the national headline rate.
  function loadData() {

    q = d3.queue()
    q.defer(d3.json, "https://raw.githubusercontent.com/ONSdigital/personal-inflation-calculator-data/main/data/data.json?cache=" + Date.now())
    q.defer(d3.json, "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/l55o/mm23/data")
    q.awaitAll(function(error, results) {
      if (error) {
        console.error("Unable to load inflation data", error)
        return
      }
      inflation = results[0]
      // Keep the latest 60 observations newest-first, with Date values for the charts.
      // Leave the downloaded JSON intact for inspection in the calculation log.
      var parseInflationDate = d3.timeParse("%Y-%m-%d")
      sourceCategories = {}
      inflation.categories.forEach(function(category) {
        sourceCategories[category.id] = category.data.slice(-dvc.time_series_totalmnths).reverse().map(function(month) {
          return {date: parseInflationDate(month.date), annualRate: month.annualRate}
        })
      })
      var updated = new Date(inflation.metadata.generatedAt)
      d3.select("#inflation-updated").text("Inflation data last updated: " + d3.utcFormat("%d %b %Y")(updated))
      // CPIH comes from the ONS L55O annual-rate series, not the category JSON.
      var parseCpihDate = d3.timeParse(dvc.cpih_time_format)
      cpih_selected = results[1].months.slice(-dvc.time_series_totalmnths).reverse().map(function(month) {
        return Object.assign({}, month, {
          date: parseCpihDate(month.date),
          value: +month.value
        })
      })
    });
  } //end load data

  // Break long SVG axis labels into tspans within the available label width.
  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineHeight = 1.1, // ems
        x = text.attr("x"),
        tspan = text.text(null).append("tspan").attr('x', x);
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr('x', x).attr("dy", lineHeight + "em").text(word);
        }
      }
    });

    var breaks = text.selectAll("tspan").size();
    text.attr("y", function() {
      return (-6 * (breaks - 1))
    });
  } //ends wrap

  // Bring the selected chart segment above its siblings so its outline is visible.
  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };



} //ends drawGraphic



// Wait for local spending-by-decile data before pym first calls drawGraphic.
if (Modernizr.svg) {

  d3.csv("deciles.csv", function(error, csv) {
    deciles_data = csv;
    //use pym to create iframed chart dependent on specified variables
    pymChild = new pym.Child({
      renderCallback: drawGraphic
    })
  })

} else {
  //use pym to create iframe containing fallback image (which is set as default)
  pymChild = new pym.Child();
  if (pymChild) {
    pymChild.sendHeight();
  }
}
