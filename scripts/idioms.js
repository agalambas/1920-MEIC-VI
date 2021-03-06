// RESIZE

d3.select(window).on('resize', function() {
    resize_bars();
    resize_map();
    resize_cloud();
});

// FILTERS

function createFilter(filter) {
    d3.select("#filter").append("li")
                        .attr("class", "list-inline-item")
                        .attr("title", filter)
                        .attr("onclick", "removeWordFilter(this);removeTimeFilter(this)")
                        .html("<span>" + filter + "</span>" + " x");
}

function removeFilter(filter) {
    d3.select("#filter").select("li[title=\'" + filter + "\']").remove();
    // d3.selectAll("#filter li")
    //     .filter(function() {
    //         console.log(d3.select("span").text());
    //         return d3.select("span").text() == filter;
    //     })
    //     .remove();
}

// HARDCODED TODO
function removeWordFilter(li) {
    create_categories_dispatch();
    dataset = categories_dataset;
    update_bars(dataset);
    var filter = li.firstChild.innerHTML;
    removeWordFilter_aux(filter);
}
function removeWordFilter_aux(filter) {
    selectedWord = undefined;
    removeFilter(filter);
    d3.selectAll(".word text").attr("opacity", 1);
}
function removeTimeFilter(li) {
    create_categories_dispatch();
    dataset = categories_dataset;
    update_bars(dataset);
    var filter = li.firstChild.innerHTML;
    removeTimeFilter_aux(filter);
}
function removeTimeFilter_aux(filter) {
    selectedTime = undefined;
    removeFilter(filter);
    d3.selectAll(".square").attr("opacity", 1).style("stroke", "#282828");
}

// CATEGORIES - BAR CHART

var categories_full_dataset;
var categories_dataset;
var categories_dispatch;
var selectedCategories = [];

d3.json("../data/USvideo_count.json").then(function (data) {
    data = data.sort(function(a, b) {
                    return d3.ascending(a.category_title, b.category_title);
                });
    categories_full_dataset = d3.nest()
                                .key(function(d) {
                                    return d.category_title;
                                })
                                .rollup(function(leaves) {
                                    return d3.sum(leaves, function(d){ return d.count; });
                                })
                                .entries(data)
                                .map(function(d){
                                    return { category_title: d.key, count: d.value};
                                });
    categories_dataset = categories_full_dataset;
    create_categories_dispatch();
    gen_bars();
});

// TITLES - WORD CLOUD

var words_full_dataset, words_dataset; // word, count
var words_byword_dataset = new Map(); // word, {category_title, count}
var words_bycategory_full_dataset = new Map (); // category_title, {word, count}
var words_bycategory_dataset = new Map ();
var words_dispatch;
var selectedWord;

d3.json("../data/USword_count.json").then(function (data) {
    words_full_dataset = d3.nest()
                           .key(function(d) { return d.word; })
                           .rollup(function(leaves) {
                               return d3.sum(leaves, function(d) { return d.count; });
                             })
                           .entries(data)
                           .map(function(d) { return { word: d.key, count: d.value}; });
    words_dataset = words_full_dataset.slice(0,100);

    words_bycategory_full_dataset = d3.nest()
                                      .key(function(d) { return d.category_title; })
                                      .map(data);
    
    categories_full_dataset.forEach(function(d) {
        words_bycategory_dataset.set(d.category_title, words_bycategory_full_dataset.get(d.category_title).slice(0,100));
    })

    words_byword_dataset = d3.nest()
                                  .key(function(d) { return d.word; })
                                  .map(data);
    
    create_words_dispatch();    
    gen_cloud();
});


//  OVERALL - SPIDER CHART
var overall_bycategory_full_dataset, overall_byword_full_dataset, overall_byword_dataset, overall_bycategory_byword_full_dataset;
var overall_dispatch;
var overall_dataset;

var logScale = d3.scaleSymlog()
  .domain([0, 5000000])
  .range([0, 5000]);

d3.json("../data/USattr_mean.json").then(function (data) {
    overall_bycategory_full_dataset = d3.nest()
                           .key(function(d) { return d.category_title; })
                           .rollup(function(leaves) {
                                return [{ axis: 'likes', value: logScale(Math.round(d3.mean(leaves, function(d) { return d.likes; })))},
                                        {axis: 'dislikes', value: logScale(Math.round(d3.mean(leaves, function(d) { return d.dislikes; })))},
                                        {axis: 'comments', value: logScale(Math.round(d3.mean(leaves, function(d) { return d.comments; })))},
                                         {axis: 'quickness to trend list', value: logScale(5000000 - Math.round(d3.mean(leaves, function(d) { return d.days_until_trendy; })))},
                                        {axis: 'views' , value: logScale(Math.round(d3.mean(leaves, function(d) { return d.views; })))}
                                ];
                            }
                           )
                           .entries(data)
                           .map(function(d) { return { name: d.key, axes: d.value, color: colors.get(d.key)}; });

    overall_dataset = [{name: "all", 
                                    axes: [{axis: 'likes', value: d3.mean(overall_bycategory_full_dataset, function(d){ return d.axes[0].value})},
                                            {axis: 'dislikes', value: d3.mean(overall_bycategory_full_dataset, function(d){ return d.axes[1].value})},
                                            {axis: 'comments', value: d3.mean(overall_bycategory_full_dataset, function(d){ return d.axes[2].value})},
                                            {axis: 'quickness to trend list', value: d3.mean(overall_bycategory_full_dataset, function(d){ return d.axes[3].value})},
                                            {axis: 'views', value: d3.mean(overall_bycategory_full_dataset, function(d){ return d.axes[4].value})}],
                                    color: '#AAAAAA'
                                    }]


    overall_byword_full_dataset = d3.nest()
                                    .key(function(d) { return d.word; })
                                    .rollup(function(leaves) {
                                        return [{ axis: 'likes', value: logScale(Math.round(d3.mean(leaves, function(d) { return d.likes; })))},
                                                {axis: 'dislikes', value: logScale(Math.round(d3.mean(leaves, function(d) { return d.dislikes; })))},
                                                {axis: 'comments', value: logScale(Math.round(d3.mean(leaves, function(d) { return d.comments; })))},
                                                {axis: 'quickness to trend list', value: logScale(5000000 - Math.round(d3.mean(leaves, function(d) { return d.days_until_trendy; })))},
                                                {axis: 'views' , value: logScale(Math.round(d3.mean(leaves, function(d) { return d.views; })))}
                                        ];
                                    }
                                    )
                                    .entries(data)
                                    .map(function(d) { return { name: d.key, axes: d.value, color: colors.get('light-yt')}; });

    overall_byword_dataset = overall_byword_full_dataset.slice(0,100)
                            
    overall_bycategory_byword_full_dataset = d3.nest()
                                                .key(function(d) { return d.category_title; })
                                                .key(function(d) { return d.word; })
                                                .rollup(function(leaves) {
                                                    return [{ axis: 'likes', value: logScale(Math.round(d3.mean(leaves, function(d) { return d.likes; })))},
                                                            {axis: 'dislikes', value: logScale(Math.round(d3.mean(leaves, function(d) { return d.dislikes; })))},
                                                            {axis: 'comments', value: logScale(Math.round(d3.mean(leaves, function(d) { return d.comments; })))},
                                                            {axis: 'quickness to trend list', value: logScale(5000000 - Math.round(d3.mean(leaves, function(d) { return d.days_until_trendy; })))},
                                                            {axis: 'views' , value: logScale(Math.round(d3.mean(leaves, function(d) { return d.views; })))}
                                                    ]
                                                })
                                                .entries(data)
    gen_spider();

});


var channels_bychannel_full_dataset, channels_bycategory_bychannel_full_dataset, channels_byword_bychannel_full_dataset, channels_bycategory_byword_bychannel_full_dataset;
var channels_bychannel_dataset, channels_bycategory_bychannel_dataset, channels_byword_bychannel_dataset, channels_bycategory_byword_bychannel_dataset;

d3.json("../data/USchannel_video_count.json").then(function (data) {
    channels_bychannel_full_dataset = d3.nest()
                            .key(function(d) { return d.channel_title; })
                            .rollup(function(leaves) {
                                return d3.sum(leaves, function(d) { return d.count; });
                            })
                            .entries(data)
                            .sort(function(a, b){ return d3.descending(a.value, b.value); })
    
    channels_bychannel_dataset = channels_bychannel_full_dataset.slice(0,3);
    

    channels_bycategory_bychannel_full_dataset = d3.nest()
                            .key(function(d) { return d.category_title })
                            .key(function(d) { return d.channel_title })
                            .rollup(function(leaves) {
                                return d3.sum(leaves, function(d) { return d.count; });
                            })
                            .entries(data)
    


    channels_byword_bychannel_full_dataset = d3.nest()
                            .key(function(d) { return d.word })
                            .key(function(d) { return d.channel_title })
                            .rollup(function(leaves) {
                                return d3.sum(leaves, function(d) { return d.count; });
                            })
                            .entries(data)



    channels_bycategory_byword_bychannel_full_dataset = d3.nest()
                            .key(function(d) { return d.category_title })
                            .key(function(d) { return d.word })
                            .key(function(d) { return d.channel_title })
                            .rollup(function(leaves) {
                                return d3.sum(leaves, function(d) { return d.count; });
                            })
                            .entries(data)


    gen_stars();
});

// SCHEDULE - HEATMAP

var schedule_full_dataset;
var schedule_dataset;
var schedule_dataset_2;
var schedule_bycategory_dataset = new Map ();
var schedule_dispatch;
var selectedTime;

d3.json("../data/UStime_cat.json").then(function (data) {
    schedule_bycategory_dataset = d3.nest()
                                    .key(function(d) { return d.category_title; })
                                    .map(data);

    schedule_bycategory_count_dataset = d3.nest()
                                            .key(function(d) { return d.day; })
                                            .key(function(d) { return d.hour; })
                                            .map(data);
});
      
d3.json("../data/UStime.json").then(function (data) {
    schedule_full_dataset = data;
    schedule_dataset = schedule_full_dataset;
    create_schedule_dispatch();
    gen_map();
});