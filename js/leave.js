//url链接中带有check=true参数，则显示审核选项卡
if(getUrlParam('check')) {
    //显示审核部分
    $('.tab-link').removeClass('active');
    $('.tab').removeClass('active');
    $('#tab3').addClass('active');
    $('#tab-check-leaves').addClass('active');
}

//判断是否是上级，上级有审核选项卡
if (isBoss) {
    //显示审核选项卡
    $('#tab-check-leaves').css('display', '');
    $('#tab3').css('display', '');
} else {
    //隐藏审核选项卡
    $('#tab-check-leaves').css('display', 'none');
    $('#tab3').css('display', 'none');
}

//是否带薪的CheckBox处理
$("#salary-checkbox").change(function() {
    var isChecked = $(this).attr("checked");
    var hintLabel = $(".label_checkbox-hint");
    if(isChecked) {
        hintLabel.text("带薪");
    }else{
        hintLabel.text("不带薪");
    }
})

//加载请假列表
function loadList() {
    $.ajax({
        type: 'GET',
        url: requestBaseUrl + 'companies/users/leave',
        headers: {
            "Authorization": "Bearer " + getToken()
        },
        success: function(data) {
            if (data.status == 10001) {
                showList(data);
            } else {
                $.toast('错误' + data.status);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            $.toast('加载请假记录出错' + jqXHR.status);
        }
    });
}

//显示请假列表
function showList(response) {
    var dataList = response.data.list;
    if (dataList == null || dataList.length == 0) {
        $('#tab-page-list').html('<div class="hint">暂无历史请假记录</div>');
        return;
    }
    template.helper('getTimeStr', getTimeStr);
    var data = {
        list: dataList
    };
    var str = '<div class="list-block media-list"><ul>';
    str += template('leave-list-template', data); 
    str += "</ul></div>";
    $('#tab-page-list').html(str);
    $('li.list-item').click(function() {
        var type = $(this).find('#type').text();
        var reason = $(this).find('#reason').text();
        var time = $(this).find('#time').text();
        var result = $(this).find('#result').text();
        var content = type + '<br/>' + reason + '<br/>' + time + '<br/>' + result;
        $.alert(content, '请假详情');
        $('.modal').css('text-align', 'left'); //让对话框中的文本左对齐
    });
}

//选择抄送对象，调用Java的选择企业通讯录方法
$('#item-deliver').click(function() {
    if (window.js_interface) {
        window.js_interface.selectDeliver();
    }
})

var leaveTypesArray = [];
var leaveTypesNameArray = [];

//获取请假类型
function loadLeaveTypes() {
    $.ajax({
        type: 'GET',
        url: requestBaseUrl + 'companies/leave/types',
        headers: {
            'Authorization': 'Bearer ' + getToken()
        },
        success: function(response) {
            if (response.status == 10001) {
                var arr = response.data.list;
                leaveTypesArray = arr;
                for (var i = 0; i < arr.length; i++) {
                    leaveTypesNameArray.push(arr[i].name);
                }
                showLeaveTypes(leaveTypesNameArray);
            }
        }
    });
}

//显示请假类型
function showLeaveTypes(types) {
    $("#select-type").picker({
        toolbarTemplate: '<header class="bar bar-nav">\
          <button class="button button-link pull-right close-picker">确定</button>\
          <h1 class="title">选择请假类型</h1>\
          </header>',
        cols: [{
            textAlign: 'center',
            values: types
        }]
    });
}

var timeNow = getTimeNow();
$('input.date-picker').datetimePicker({
    value: [timeNow.yearStr, timeNow.monthStr,
        timeNow.dayStr, timeNow.hourStr, timeNow.minuteStr
    ]
});

//加载请假审核列表
function loadCheckLeaveList() {
    $.ajax({
        type: 'GET',
        url: requestBaseUrl + 'companies/users/leave/check',
        headers: {
            'Authorization': 'Bearer ' + getToken()
        },
        success: function(response) {
            if(response.status == 10001) {
                var list = response.data.list;
                if(list.length > 0) {
                    showCheckLeaveList(list);
                }else{
                    showNoCheckLeaveHint();
                }
            }
        },
        error: function() {
            showNoCheckLeaveHint();
        }
    })
}

//显示请假审核列表
function showCheckLeaveList(list) {
    var data = {
        list: list
    };
    template.helper('getTimeStr', getTimeStr);
    $('#tab-page-check-content').html(template('leave-check-list-template', data));
    
    //同意按钮的点击处理
    $('[class="link agree"]').click(function() {
        showAgreeOrNotDialog($(this).attr('id'), true, list);
        // $.toast('agree id = ' + $(this).attr('id'));
    });
    //不同意按钮的点击处理
    $('[class="link disagree"]').click(function() {
        showAgreeOrNotDialog($(this).attr('id'), false, list);
        // $.toast('disagree id = ' + $(this).attr('id'));
    });
}

//显示同意或拒绝对话框
function showAgreeOrNotDialog(id, isAgree, list) {
    var msg = '';
    if(isAgree) {
        msg = '确定要同意该请假申请吗？';
    }else{
        msg = '确定要拒绝该请假申请吗？';
    }
    $.confirm(msg, '提示', function() {
        //确定同意或拒绝
        operateAgreeOrNot(id, isAgree, list);
    });
}

//操作某条申请，同意或者拒绝
function operateAgreeOrNot(id, isAgree, list) {
    var url = requestBaseUrl + 'companies/users/leave/' + id;
    var type = 'PUT';
    if(!isAgree) {
        //拒绝加班申请，请求的method为delete，同意的method为put
        type = "DELETE";
    }
    $.ajax({
        url: url,
        type: type,
        headers: {
            'Authorization': 'Bearer ' + getToken()
        },
        success: function(response) {
            if(response.status == 10001) {
                $.toast('操作成功');
                //删除当前列表中的操作项
                $('div#card-id-' + id).remove();
                if(list.length == 1) {
                    //删除成功后，列表为空，则显示提示信息
                    showNoCheckLeaveHint();
                }
            }else{
                $.toast('操作失败，错误码：' + response.status);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            $.toast('操作失败' + jqXHR.status);
        }
    })
}

//提示无待审核的请假申请
function showNoCheckLeaveHint() {
    $('#tab-page-check-content').html('<div class="hint">暂无待审核的请假申请</div>');
}

//清空表单内容
$('#btn-clear').click(function() {
    $.confirm('确定要清空填写的内容吗？', '提示', function() {
        clearForm();
    });
})

//提交表单
$('#btn-submit').click(function() {
    var type = $('#select-type').val();
    var reason = $('#leave-reason').val();
    var startTime = $('#start-time-picker').val();
    var endTime = $('#end-time-picker').val();
    var hours = $('#hours').val();
    var isChecked = $("#salary-checkbox").attr('checked');
    var have_salary;
    if(isChecked) {
        have_salary = 1;
        // $.toast('带薪');
    }else{
        // $.toast('不带薪');
        have_salary = 2;
    }
    if (isEmpty(type)) {
        $.toast('请选择请假类型');
        return;
    }
    if (isEmpty(reason)) {
        $.toast('请填写请假原因');
        return;
    }
    if (isEmpty(startTime) || isEmpty(endTime)) {
        $.toast('请选择请假时间');
        return;
    }
    if (compareDateStr(startTime + ':00', endTime + ':00') != -1) {
        $.toast('开始时间必须在结束时间之前');
        return;
    }
    if (isEmpty(hours)) {
        $.toast('请填写请假小时');
        return;
    }
    if (!isNumber(hours) || hours <= 0) {
        $.toast('请假小时数填写有误');
        return;
    }
    startTime = startTime.replace(/-/g,"/");
    endTime = endTime.replace(/-/g,"/");
    //要发给上级的聊天消息数据
    var msg = '请假申请单\n类型：' + type + '\n原因：'
                + reason + '\n开始时间：' + startTime
                + '\n结束时间：' + endTime;
    //可以提交数据了
    submitLeaveApply(getLeaveTypeIdByName(type), reason, startTime, endTime, hours, have_salary, msg);
})

//根据请假名称获取对应的ID
function getLeaveTypeIdByName(typeName) {
    var obj;
    var name;
    for (var i = 0; i < leaveTypesArray.length; i++) {
        obj = leaveTypesArray[i];
        name = obj.name;
        if (name == typeName) {
            return obj.id;
        }
    }
    return 1;
}

//清空表单数据
function clearForm() {
    $('#select-type').val('');
    $('#leave-reason').val('');
    // $('#st  ime-picker').val('');
    $('#hours').val('');
}

//加载请假记录
loadList();

//加载请假类型
loadLeaveTypes();

//加载请假审核列表
loadCheckLeaveList();

//加载我的上级信息
getMyLeader();
