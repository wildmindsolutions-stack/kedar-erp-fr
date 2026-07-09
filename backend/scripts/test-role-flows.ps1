# Kedar ERP - Role flow API test script
$base = "http://localhost:3001/api"
$results = @()

function Login($email) {
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body (@{email=$email;password="admin123"} | ConvertTo-Json)
  return $r.accessToken
}

function Api($method, $path, $token, $body=$null) {
  $headers = @{ Authorization = "Bearer $token" }
  $params = @{ Uri = "$base$path"; Method = $method; Headers = $headers }
  if ($body) { $params.ContentType = "application/json"; $params.Body = ($body | ConvertTo-Json -Depth 5) }
  try {
    $r = Invoke-RestMethod @params
    return @{ ok = $true; data = $r }
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    return @{ ok = $false; code = $code; err = $_.ErrorDetails.Message }
  }
}

Write-Host "`n=== KEDAR ERP ROLE FLOW TEST ===`n"

# --- WAREHOUSE ---
Write-Host "[1] WAREHOUSE (warehouse@kedarenterprise.com)"
$wh = Login "warehouse@kedarenterprise.com"
$products = (Api GET "/products" $wh).data
$wheat = $products | Where-Object { $_.name -eq "Wheat" } | Select-Object -First 1
$prod = Api POST "/manufacturing" $wh @{ productId=$wheat.id; batchNo="UAT-WHT-$(Get-Date -Format 'HHmmss')"; batchDate=(Get-Date -Format 'yyyy-MM-dd'); qtyProduced=50; notes="UAT test" }
$inv = Api GET "/inventory" $wh
$dash = Api GET "/dashboard" $wh
Write-Host "  Production entry: $(if($prod.ok){'OK'}else{"FAIL $($prod.code)"})"
Write-Host "  Inventory view: $(if($inv.ok){'OK'}else{"FAIL $($prod.code)"})"
Write-Host "  Dashboard: $(if($dash.ok){'OK'}else{"FAIL $($dash.code) - re-login if 403"})"

# --- SALES ---
Write-Host "`n[2] SALES (sales@kedarenterprise.com)"
$sl = Login "sales@kedarenterprise.com"
$customers = (Api GET "/customers" $sl).data
$cust = $customers | Select-Object -First 1
$flour = $products | Where-Object { $_.name -eq "Wheat Flour" } | Select-Object -First 1
$order = Api POST "/sales/orders" $sl @{
  customerId=$cust.id; orderDate=(Get-Date -Format 'yyyy-MM-dd')
  items=@(@{ productId=$flour.id; qty=10; rate=[decimal]$flour.price })
}
$payBlock = Api GET "/payments" $sl
Write-Host "  Create sales order: $(if($order.ok){'OK - order '+$order.data.status}else{"FAIL $($order.code)"})"
Write-Host "  Payments (should FAIL 403): $(if(-not $payBlock.ok -and $payBlock.code -eq 403){'OK blocked'}else{'UNEXPECTED'})"
$orderId = $order.data.id

# --- ACCOUNTANT ---
Write-Host "`n[3] ACCOUNTANT (accountant@kedarenterprise.com)"
$ac = Login "accountant@kedarenterprise.com"
$confirm = Api POST "/sales/orders/$orderId/confirm" $ac @{}
$mfgBlock = Api POST "/manufacturing" $ac @{ productId=$wheat.id; batchNo="X"; batchDate="2026-07-03"; qtyProduced=1 }
Write-Host "  Confirm order + invoice: $(if($confirm.ok){'OK - '+$confirm.data.invoiceNo}else{"FAIL $($confirm.code) $($confirm.err)"})"
Write-Host "  Manufacturing (should FAIL 403): $(if(-not $mfgBlock.ok -and $mfgBlock.code -eq 403){'OK blocked'}else{'UNEXPECTED'})"
$invoiceId = $confirm.data.id
$payment = Api POST "/payments" $ac @{
  customerId=$cust.id; amount=500; mode="UPI"; receivedAt=(Get-Date -Format 'yyyy-MM-dd'); reference="UAT-001"
}
Write-Host "  Record payment: $(if($payment.ok){'OK'}else{"FAIL $($payment.code)"})"

# --- WAREHOUSE DELIVERY ---
Write-Host "`n[4] WAREHOUSE - Delivery"
$del = Api POST "/delivery" $wh @{ invoiceId=$invoiceId; vehicle="MH-12-AB-1234"; driverName="Ramesh" }
$dispatch = Api PATCH "/delivery/$($del.data.id)/dispatch" $wh @{ vehicle="MH-12-AB-1234" }
$delivered = Api PATCH "/delivery/$($del.data.id)/delivered" $wh @{}
Write-Host "  Create challan: $(if($del.ok){'OK - '+$del.data.challanNo}else{"FAIL"})"
Write-Host "  Dispatch: $(if($dispatch.ok){'OK'}else{"FAIL"})"
Write-Host "  Delivered: $(if($delivered.ok){'OK'}else{"FAIL"})"

# --- MANAGER ---
Write-Host "`n[5] MANAGER (manager@kedarenterprise.com)"
$mg = Login "manager@kedarenterprise.com"
$dashM = Api GET "/dashboard" $mg
$usersBlock = Api GET "/users" $mg
Write-Host "  Dashboard: $(if($dashM.ok){'OK'}else{"FAIL"})"
Write-Host "  Users (should FAIL 403): $(if(-not $usersBlock.ok -and $usersBlock.code -eq 403){'OK blocked'}else{'UNEXPECTED'})"

# --- OWNER ---
Write-Host "`n[6] OWNER (admin@kedarenterprise.com)"
$ow = Login "admin@kedarenterprise.com"
$notif = Api GET "/notifications" $ow
$users = Api GET "/users" $ow
Write-Host "  Notifications: $(if($notif.ok){'OK - '+$notif.data.Count+' items'}else{"FAIL"})"
Write-Host "  Users admin: $(if($users.ok){'OK - '+$users.data.Count+' users'}else{"FAIL"})"

Write-Host "`n=== ALL ROLE TESTS COMPLETE ===`n"
