function changeState(targetID)
{
	var id = "#" +targetID.substr(0,targetID.length-1);
	var ans = targetID.substr(length-1);
	
	if(ans == 'y')
	{
		$(id).val("y");
		$(id+"y").attr('disabled','disabled');
		$(id).parent().css("background-color"," rgba(92, 184, 92, 0.5)");
		$(id+"n").removeAttr('disabled');
	}
	else
	{
		$(id).val("n");
		$(id+"n").attr('disabled','disabled');
		$(id).parent().css("background-color","rgba(217, 83, 79, 0.5)");
		$(id+"y").removeAttr('disabled');	
	}
}

$(document).ready(function(){
	$("button").removeAttr('disabled');

});