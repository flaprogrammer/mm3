$(document).ready(function(){

	$(".btn-slide").click(function(){
	  $("#panel").slideToggle("slow");
	  $(this).toggleClass("active");
	});
	
		$(".task_block").click(function(){
			document.getElementsByClassName('btn-slide')[0].click();
	});
	
	
	
});

