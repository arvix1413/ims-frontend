# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: return-order-test.spec.ts >> 退货订单功能 E2E 测试 - 生产环境 >> 测试5: 选择操作员不崩溃
- Location: tests/return-order-test.spec.ts:177:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=操作员').or(locator('text=Operator'))
Expected: visible
Error: strict mode violation: locator('text=操作员').or(locator('text=Operator')) resolved to 2 elements:
    1) <label for="operator" title="Operator" class="ant-form-item-required">Operator</label> aka getByText('Operator', { exact: true })
    2) <span class="ant-select-selection-placeholder">Please enter operator</span> aka getByText('Please enter operator')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=操作员').or(locator('text=Operator'))

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e8]: Slady
        - generic [ref=e9]:
          - combobox [ref=e11]:
            - option "中文"
            - option "English" [selected]
          - generic [ref=e12]:
            - generic [ref=e13]:
              - generic [ref=e14]: ern
              - generic [ref=e15]: ADMIN
            - generic [ref=e16]: e
            - button "Logout" [ref=e17]:
              - generic [ref=e18]: Logout
    - button "折叠Header" [ref=e19]:
      - img [ref=e20]
    - generic [ref=e22]:
      - complementary [ref=e24]:
        - button "折叠侧边栏" [ref=e26]:
          - img [ref=e27]
        - navigation [ref=e29]:
          - list [ref=e30]:
            - listitem [ref=e31]:
              - button "Design Management" [ref=e32]:
                - img [ref=e34]
                - generic [ref=e36]: Design Management
            - listitem [ref=e37]:
              - button "Employee Management" [ref=e38]:
                - img [ref=e40]
                - generic [ref=e45]: Employee Management
            - listitem [ref=e46]:
              - button "Order Management" [ref=e47]:
                - img [ref=e49]
                - generic [ref=e54]: Order Management
            - listitem [ref=e55]:
              - button "Inventory Records" [ref=e56]:
                - img [ref=e58]
                - generic [ref=e62]: Inventory Records
            - listitem [ref=e63]:
              - button "Employee History" [ref=e64]:
                - img [ref=e66]
                - generic [ref=e69]: Employee History
            - listitem [ref=e70]:
              - button "Sales Orders" [ref=e71]:
                - img [ref=e73]
                - generic [ref=e75]: Sales Orders
            - listitem [ref=e76]:
              - button "Member Orders" [ref=e77]:
                - img [ref=e79]
                - generic [ref=e83]: Member Orders
            - listitem [ref=e84]:
              - button "Customer Management" [ref=e85]:
                - img [ref=e87]
                - generic [ref=e91]: Customer Management
      - main [ref=e93]:
        - generic [ref=e96]:
          - generic [ref=e98]:
            - button "printer Create Sales Order" [ref=e99] [cursor=pointer]:
              - img "printer" [ref=e101]:
                - img [ref=e102]
              - generic [ref=e104]: Create Sales Order
            - button "plus Return Order" [ref=e105] [cursor=pointer]:
              - img "plus" [ref=e107]:
                - img [ref=e108]
              - generic [ref=e111]: Return Order
            - button "Print Daily Report" [ref=e112] [cursor=pointer]:
              - generic [ref=e113]: Print Daily Report
            - button "Daily Sales Summary" [ref=e114] [cursor=pointer]:
              - generic [ref=e115]: Daily Sales Summary
            - button "Payment Method Sales" [ref=e116] [cursor=pointer]:
              - generic [ref=e117]: Payment Method Sales
            - button "Cash In/Out" [ref=e118] [cursor=pointer]:
              - generic [ref=e119]: Cash In/Out
            - button "Opening/Closing Balance" [ref=e120] [cursor=pointer]:
              - generic [ref=e121]: Opening/Closing Balance
            - button "Open Cash Drawer" [ref=e122] [cursor=pointer]:
              - generic [ref=e123]: Open Cash Drawer
          - generic [ref=e126]:
            - generic [ref=e128]:
              - generic "Search Product" [ref=e130]
              - textbox "Search Product Search Product" [ref=e134]:
                - /placeholder: Item Code
            - generic [ref=e136]:
              - generic "Order No." [ref=e138]
              - textbox "Order No. Order No." [ref=e142]:
                - /placeholder: OR260707
            - generic [ref=e144]:
              - generic "Phone" [ref=e146]
              - textbox "Phone Phone" [ref=e150]:
                - /placeholder: Customer Phone
            - generic [ref=e152]:
              - generic "Color" [ref=e154]
              - textbox "Color Color" [ref=e158]:
                - /placeholder: Color
            - generic [ref=e160]:
              - generic "Size" [ref=e162]
              - textbox "Size Size" [ref=e166]:
                - /placeholder: Size
            - generic [ref=e168]:
              - generic "Type" [ref=e170]
              - generic [ref=e174] [cursor=pointer]:
                - generic [ref=e176]:
                  - combobox "Type Type" [ref=e178]
                  - generic: Order/In Stock
                - generic:
                  - img:
                    - img
            - generic [ref=e180]:
              - generic "Create Time" [ref=e182]
              - generic [ref=e186]:
                - textbox "Create Time Create Time" [ref=e188]:
                  - /placeholder: Start Time
                - generic "to" [ref=e190]:
                  - img "swap-right" [ref=e191]:
                    - img [ref=e192]
                - textbox "End Time" [ref=e195]
                - generic:
                  - img "calendar":
                    - img
            - generic [ref=e200]:
              - button "search Search" [ref=e201] [cursor=pointer]:
                - img "search" [ref=e203]:
                  - img [ref=e204]
                - generic [ref=e206]: Search
              - button "reload Reset" [ref=e207] [cursor=pointer]:
                - img "reload" [ref=e209]:
                  - img [ref=e210]
                - generic [ref=e212]: Reset
          - generic [ref=e214]:
            - generic [ref=e215]:
              - tablist [ref=e216]:
                - generic [ref=e218]:
                  - tab "二店" [selected] [ref=e220] [cursor=pointer]
                  - tab "一店" [ref=e222] [cursor=pointer]
              - tabpanel "二店" [ref=e225]:
                - generic [ref=e230]:
                  - table [ref=e232]:
                    - rowgroup [ref=e245]:
                      - row "Receipt ID Order No. Item Date Cashier Customer Name Customer Phone Payment void Reprint Operation" [ref=e246]:
                        - columnheader "Receipt ID" [ref=e247]
                        - columnheader "Order No." [ref=e248]
                        - columnheader "Item" [ref=e249]
                        - columnheader "Date" [ref=e250]
                        - columnheader "Cashier" [ref=e251]
                        - columnheader "Customer Name" [ref=e252]
                        - columnheader "Customer Phone" [ref=e253]
                        - columnheader "Payment" [ref=e254]
                        - columnheader "void" [ref=e255]
                        - columnheader "Reprint" [ref=e256]
                        - columnheader "Operation" [ref=e257]
                  - table [ref=e259]:
                    - rowgroup [ref=e272]:
                      - 'row "1525 OR26071900520002 0411SK174 Blue L [ORDER] × 1 | $179.00 19-Jul-2026 13:17:48 Gabrielle SHERIN 86888499 VISA: $179.00 normal reprint close-circle void" [ref=e273]':
                        - cell "1525" [ref=e274]
                        - cell "OR26071900520002" [ref=e275]
                        - cell "0411SK174 Blue L [ORDER] × 1 | $179.00" [ref=e276]:
                          - generic [ref=e278]:
                            - text: 0411SK174
                            - generic [ref=e279]: Blue
                            - generic [ref=e280]: L
                            - text: "[ORDER]"
                            - generic [ref=e281]: × 1
                            - generic [ref=e282]: "| $179.00"
                        - cell "19-Jul-2026 13:17:48" [ref=e283]
                        - cell "Gabrielle" [ref=e284]
                        - cell "SHERIN" [ref=e285]
                        - cell "86888499" [ref=e286]
                        - 'cell "VISA: $179.00" [ref=e287]':
                          - generic [ref=e289]: "VISA: $179.00"
                        - cell "normal" [ref=e290]:
                          - generic [ref=e291]: normal
                        - cell "reprint" [ref=e292]:
                          - button "reprint" [ref=e293] [cursor=pointer]:
                            - generic [ref=e294]: reprint
                        - cell "close-circle void" [ref=e295]:
                          - button "close-circle void" [ref=e296] [cursor=pointer]:
                            - img "close-circle" [ref=e298]:
                              - img [ref=e299]
                            - generic [ref=e301]: void
                      - 'row "1524 OR26071900520001 3334JK001CL Black M × 1 | $169.00 19-Jul-2026 13:13:49 Gabrielle - - Master: $169.00 normal reprint close-circle void" [ref=e302]':
                        - cell "1524" [ref=e303]
                        - cell "OR26071900520001" [ref=e304]
                        - cell "3334JK001CL Black M × 1 | $169.00" [ref=e305]:
                          - generic [ref=e307]:
                            - text: 3334JK001CL
                            - generic [ref=e308]: Black
                            - generic [ref=e309]: M
                            - generic [ref=e310]: × 1
                            - generic [ref=e311]: "| $169.00"
                        - cell "19-Jul-2026 13:13:49" [ref=e312]
                        - cell "Gabrielle" [ref=e313]
                        - cell "-" [ref=e314]
                        - cell "-" [ref=e315]
                        - 'cell "Master: $169.00" [ref=e316]':
                          - generic [ref=e318]: "Master: $169.00"
                        - cell "normal" [ref=e319]:
                          - generic [ref=e320]: normal
                        - cell "reprint" [ref=e321]:
                          - button "reprint" [ref=e322] [cursor=pointer]:
                            - generic [ref=e323]: reprint
                        - cell "close-circle void" [ref=e324]:
                          - button "close-circle void" [ref=e325] [cursor=pointer]:
                            - img "close-circle" [ref=e327]:
                              - img [ref=e328]
                            - generic [ref=e330]: void
                      - 'row "1523 OR26071800520010 0411DR075 Beige M × 1 | $100.00 Package1800 × 1 | $1800.00 18-Jul-2026 20:19:55 Gabrielle Claire 96879176 Master: $1612.00 VISA: $188.00 Master: $100.00 normal reprint close-circle void" [ref=e331]':
                        - cell "1523" [ref=e332]
                        - cell "OR26071800520010" [ref=e333]
                        - cell "0411DR075 Beige M × 1 | $100.00 Package1800 × 1 | $1800.00" [ref=e334]:
                          - generic [ref=e335]:
                            - generic [ref=e336]:
                              - text: 0411DR075
                              - generic [ref=e337]: Beige
                              - generic [ref=e338]: M
                              - generic [ref=e339]: × 1
                              - generic [ref=e340]: "| $100.00"
                            - generic [ref=e341]:
                              - text: Package1800
                              - generic [ref=e342]: × 1
                              - generic [ref=e343]: "| $1800.00"
                        - cell "18-Jul-2026 20:19:55" [ref=e344]
                        - cell "Gabrielle" [ref=e345]
                        - cell "Claire" [ref=e346]
                        - cell "96879176" [ref=e347]
                        - 'cell "Master: $1612.00 VISA: $188.00 Master: $100.00" [ref=e348]':
                          - generic [ref=e349]:
                            - generic [ref=e350]: "Master: $1612.00"
                            - generic [ref=e351]: "VISA: $188.00"
                            - generic [ref=e352]: "Master: $100.00"
                        - cell "normal" [ref=e353]:
                          - generic [ref=e354]: normal
                        - cell "reprint" [ref=e355]:
                          - button "reprint" [ref=e356] [cursor=pointer]:
                            - generic [ref=e357]: reprint
                        - cell "close-circle void" [ref=e358]:
                          - button "close-circle void" [ref=e359] [cursor=pointer]:
                            - img "close-circle" [ref=e361]:
                              - img [ref=e362]
                            - generic [ref=e364]: void
                      - 'row "1522 OR26071800520009 Package1800 × 1 | $1800.00 18-Jul-2026 19:53:06 Gabrielle - - Master: $1800.00 void reprint close-circle void" [ref=e365]':
                        - cell "1522" [ref=e366]
                        - cell "OR26071800520009" [ref=e367]
                        - cell "Package1800 × 1 | $1800.00" [ref=e368]:
                          - generic [ref=e370]:
                            - text: Package1800
                            - generic [ref=e371]: × 1
                            - generic [ref=e372]: "| $1800.00"
                        - cell "18-Jul-2026 19:53:06" [ref=e373]
                        - cell "Gabrielle" [ref=e374]
                        - cell "-" [ref=e375]
                        - cell "-" [ref=e376]
                        - 'cell "Master: $1800.00" [ref=e377]':
                          - generic [ref=e379]: "Master: $1800.00"
                        - cell "void" [ref=e380]:
                          - generic [ref=e381]: void
                        - cell "reprint" [ref=e382]:
                          - button "reprint" [ref=e383] [cursor=pointer]:
                            - generic [ref=e384]: reprint
                        - cell "close-circle void" [ref=e385]:
                          - button "close-circle void" [ref=e386] [cursor=pointer]:
                            - img "close-circle" [ref=e388]:
                              - img [ref=e389]
                            - generic [ref=e391]: void
                      - 'row "1521 OR26071800520008 SLTGO020 White M × 1 | $399.00 18-Jul-2026 16:47:57 Gabrielle - - VISA: $399.00 normal reprint close-circle void" [ref=e392]':
                        - cell "1521" [ref=e393]
                        - cell "OR26071800520008" [ref=e394]
                        - cell "SLTGO020 White M × 1 | $399.00" [ref=e395]:
                          - generic [ref=e397]:
                            - text: SLTGO020
                            - generic [ref=e398]: White
                            - generic [ref=e399]: M
                            - generic [ref=e400]: × 1
                            - generic [ref=e401]: "| $399.00"
                        - cell "18-Jul-2026 16:47:57" [ref=e402]
                        - cell "Gabrielle" [ref=e403]
                        - cell "-" [ref=e404]
                        - cell "-" [ref=e405]
                        - 'cell "VISA: $399.00" [ref=e406]':
                          - generic [ref=e408]: "VISA: $399.00"
                        - cell "normal" [ref=e409]:
                          - generic [ref=e410]: normal
                        - cell "reprint" [ref=e411]:
                          - button "reprint" [ref=e412] [cursor=pointer]:
                            - generic [ref=e413]: reprint
                        - cell "close-circle void" [ref=e414]:
                          - button "close-circle void" [ref=e415] [cursor=pointer]:
                            - img "close-circle" [ref=e417]:
                              - img [ref=e418]
                            - generic [ref=e420]: void
                      - 'row "1520 OR26071800520007 3115JK054 Blue Free Size × 1 | $219.00 3115PT044 Blue M × 1 | $169.00 18-Jul-2026 16:47:03 Gabrielle - - Master: $388.00 normal reprint close-circle void" [ref=e421]':
                        - cell "1520" [ref=e422]
                        - cell "OR26071800520007" [ref=e423]
                        - cell "3115JK054 Blue Free Size × 1 | $219.00 3115PT044 Blue M × 1 | $169.00" [ref=e424]:
                          - generic [ref=e425]:
                            - generic [ref=e426]:
                              - text: 3115JK054
                              - generic [ref=e427]: Blue
                              - generic [ref=e428]: Free Size
                              - generic [ref=e429]: × 1
                              - generic [ref=e430]: "| $219.00"
                            - generic [ref=e431]:
                              - text: 3115PT044
                              - generic [ref=e432]: Blue
                              - generic [ref=e433]: M
                              - generic [ref=e434]: × 1
                              - generic [ref=e435]: "| $169.00"
                        - cell "18-Jul-2026 16:47:03" [ref=e436]
                        - cell "Gabrielle" [ref=e437]
                        - cell "-" [ref=e438]
                        - cell "-" [ref=e439]
                        - 'cell "Master: $388.00" [ref=e440]':
                          - generic [ref=e442]: "Master: $388.00"
                        - cell "normal" [ref=e443]:
                          - generic [ref=e444]: normal
                        - cell "reprint" [ref=e445]:
                          - button "reprint" [ref=e446] [cursor=pointer]:
                            - generic [ref=e447]: reprint
                        - cell "close-circle void" [ref=e448]:
                          - button "close-circle void" [ref=e449] [cursor=pointer]:
                            - img "close-circle" [ref=e451]:
                              - img [ref=e452]
                            - generic [ref=e454]: void
                      - 'row "1519 OR26071800520006 Q541TB010 Purple One Size [ORDER] × 1 | $159.00 0117PT011 Black M [ORDER] × 1 | $29.00 18-Jul-2026 16:45:15 Gabrielle SHARLEEN 89473149 VISA: $188.00 void reprint close-circle void" [ref=e455]':
                        - cell "1519" [ref=e456]
                        - cell "OR26071800520006" [ref=e457]
                        - cell "Q541TB010 Purple One Size [ORDER] × 1 | $159.00 0117PT011 Black M [ORDER] × 1 | $29.00" [ref=e458]:
                          - generic [ref=e459]:
                            - generic [ref=e460]:
                              - text: Q541TB010
                              - generic [ref=e461]: Purple
                              - generic [ref=e462]: One Size
                              - text: "[ORDER]"
                              - generic [ref=e463]: × 1
                              - generic [ref=e464]: "| $159.00"
                            - generic [ref=e465]:
                              - text: 0117PT011
                              - generic [ref=e466]: Black
                              - generic [ref=e467]: M
                              - text: "[ORDER]"
                              - generic [ref=e468]: × 1
                              - generic [ref=e469]: "| $29.00"
                        - cell "18-Jul-2026 16:45:15" [ref=e470]
                        - cell "Gabrielle" [ref=e471]
                        - cell "SHARLEEN" [ref=e472]
                        - cell "89473149" [ref=e473]
                        - 'cell "VISA: $188.00" [ref=e474]':
                          - generic [ref=e476]: "VISA: $188.00"
                        - cell "void" [ref=e477]:
                          - generic [ref=e478]: void
                        - cell "reprint" [ref=e479]:
                          - button "reprint" [ref=e480] [cursor=pointer]:
                            - generic [ref=e481]: reprint
                        - cell "close-circle void" [ref=e482]:
                          - button "close-circle void" [ref=e483] [cursor=pointer]:
                            - img "close-circle" [ref=e485]:
                              - img [ref=e486]
                            - generic [ref=e488]: void
                      - 'row "1518 OR26071800520005 SLMTB004 Black L × 1 | $20.00 18-Jul-2026 14:49:55 Xiao Li VANESSA 90271519 Master: $20.00 normal reprint close-circle void" [ref=e489]':
                        - cell "1518" [ref=e490]
                        - cell "OR26071800520005" [ref=e491]
                        - cell "SLMTB004 Black L × 1 | $20.00" [ref=e492]:
                          - generic [ref=e494]:
                            - text: SLMTB004
                            - generic [ref=e495]: Black
                            - generic [ref=e496]: L
                            - generic [ref=e497]: × 1
                            - generic [ref=e498]: "| $20.00"
                        - cell "18-Jul-2026 14:49:55" [ref=e499]
                        - cell "Xiao Li" [ref=e500]
                        - cell "VANESSA" [ref=e501]
                        - cell "90271519" [ref=e502]
                        - 'cell "Master: $20.00" [ref=e503]':
                          - generic [ref=e505]: "Master: $20.00"
                        - cell "normal" [ref=e506]:
                          - generic [ref=e507]: normal
                        - cell "reprint" [ref=e508]:
                          - button "reprint" [ref=e509] [cursor=pointer]:
                            - generic [ref=e510]: reprint
                        - cell "close-circle void" [ref=e511]:
                          - button "close-circle void" [ref=e512] [cursor=pointer]:
                            - img "close-circle" [ref=e514]:
                              - img [ref=e515]
                            - generic [ref=e517]: void
                      - 'row "1517 OR26071800520004 0113TB097 White M × 1 | $149.00 3334JK002 Light Blue S × 1 | $159.00 0135PT007CL Black L × 1 | $189.00 18-Jul-2026 13:33:33 Gabrielle - - VISA: $497.00 normal reprint close-circle void" [ref=e518]':
                        - cell "1517" [ref=e519]
                        - cell "OR26071800520004" [ref=e520]
                        - cell "0113TB097 White M × 1 | $149.00 3334JK002 Light Blue S × 1 | $159.00 0135PT007CL Black L × 1 | $189.00" [ref=e521]:
                          - generic [ref=e522]:
                            - generic [ref=e523]:
                              - text: 0113TB097
                              - generic [ref=e524]: White
                              - generic [ref=e525]: M
                              - generic [ref=e526]: × 1
                              - generic [ref=e527]: "| $149.00"
                            - generic [ref=e528]:
                              - text: 3334JK002
                              - generic [ref=e529]: Light Blue
                              - generic [ref=e530]: S
                              - generic [ref=e531]: × 1
                              - generic [ref=e532]: "| $159.00"
                            - generic [ref=e533]:
                              - text: 0135PT007CL
                              - generic [ref=e534]: Black
                              - generic [ref=e535]: L
                              - generic [ref=e536]: × 1
                              - generic [ref=e537]: "| $189.00"
                        - cell "18-Jul-2026 13:33:33" [ref=e538]
                        - cell "Gabrielle" [ref=e539]
                        - cell "-" [ref=e540]
                        - cell "-" [ref=e541]
                        - 'cell "VISA: $497.00" [ref=e542]':
                          - generic [ref=e544]: "VISA: $497.00"
                        - cell "normal" [ref=e545]:
                          - generic [ref=e546]: normal
                        - cell "reprint" [ref=e547]:
                          - button "reprint" [ref=e548] [cursor=pointer]:
                            - generic [ref=e549]: reprint
                        - cell "close-circle void" [ref=e550]:
                          - button "close-circle void" [ref=e551] [cursor=pointer]:
                            - img "close-circle" [ref=e553]:
                              - img [ref=e554]
                            - generic [ref=e556]: void
                      - 'row "1516 OR26071800520003 SLMTB003 Pink M [ORDER] × 1 | $179.00 18-Jul-2026 13:20:01 Xiao Li Li Li 90186884 Master: $179.00 normal reprint close-circle void" [ref=e557]':
                        - cell "1516" [ref=e558]
                        - cell "OR26071800520003" [ref=e559]
                        - cell "SLMTB003 Pink M [ORDER] × 1 | $179.00" [ref=e560]:
                          - generic [ref=e562]:
                            - text: SLMTB003
                            - generic [ref=e563]: Pink
                            - generic [ref=e564]: M
                            - text: "[ORDER]"
                            - generic [ref=e565]: × 1
                            - generic [ref=e566]: "| $179.00"
                        - cell "18-Jul-2026 13:20:01" [ref=e567]
                        - cell "Xiao Li" [ref=e568]
                        - cell "Li Li" [ref=e569]
                        - cell "90186884" [ref=e570]
                        - 'cell "Master: $179.00" [ref=e571]':
                          - generic [ref=e573]: "Master: $179.00"
                        - cell "normal" [ref=e574]:
                          - generic [ref=e575]: normal
                        - cell "reprint" [ref=e576]:
                          - button "reprint" [ref=e577] [cursor=pointer]:
                            - generic [ref=e578]: reprint
                        - cell "close-circle void" [ref=e579]:
                          - button "close-circle void" [ref=e580] [cursor=pointer]:
                            - img "close-circle" [ref=e582]:
                              - img [ref=e583]
                            - generic [ref=e585]: void
                      - 'row "1515 OR26071800520002 0084TB087 Pink Free Size × 1 | $135.15 2219TB020 White One Size × 1 | $118.15 2219PT031 Blue S × 1 | $118.15 18-Jul-2026 11:45:31 Xiao Li - - Nets: $371.45 normal reprint close-circle void" [ref=e586]':
                        - cell "1515" [ref=e587]
                        - cell "OR26071800520002" [ref=e588]
                        - cell "0084TB087 Pink Free Size × 1 | $135.15 2219TB020 White One Size × 1 | $118.15 2219PT031 Blue S × 1 | $118.15" [ref=e589]:
                          - generic [ref=e590]:
                            - generic [ref=e591]:
                              - text: 0084TB087
                              - generic [ref=e592]: Pink
                              - generic [ref=e593]: Free Size
                              - generic [ref=e594]: × 1
                              - generic [ref=e595]: "| $135.15"
                            - generic [ref=e596]:
                              - text: 2219TB020
                              - generic [ref=e597]: White
                              - generic [ref=e598]: One Size
                              - generic [ref=e599]: × 1
                              - generic [ref=e600]: "| $118.15"
                            - generic [ref=e601]:
                              - text: 2219PT031
                              - generic [ref=e602]: Blue
                              - generic [ref=e603]: S
                              - generic [ref=e604]: × 1
                              - generic [ref=e605]: "| $118.15"
                        - cell "18-Jul-2026 11:45:31" [ref=e606]
                        - cell "Xiao Li" [ref=e607]
                        - cell "-" [ref=e608]
                        - cell "-" [ref=e609]
                        - 'cell "Nets: $371.45" [ref=e610]':
                          - generic [ref=e612]: "Nets: $371.45"
                        - cell "normal" [ref=e613]:
                          - generic [ref=e614]: normal
                        - cell "reprint" [ref=e615]:
                          - button "reprint" [ref=e616] [cursor=pointer]:
                            - generic [ref=e617]: reprint
                        - cell "close-circle void" [ref=e618]:
                          - button "close-circle void" [ref=e619] [cursor=pointer]:
                            - img "close-circle" [ref=e621]:
                              - img [ref=e622]
                            - generic [ref=e624]: void
                      - 'row "1514 OR26071800520001 0610DR029 Black S × 1 | $206.10 18-Jul-2026 11:22:16 Xiao Li - - AMEX: $206.10 normal reprint close-circle void" [ref=e625]':
                        - cell "1514" [ref=e626]
                        - cell "OR26071800520001" [ref=e627]
                        - cell "0610DR029 Black S × 1 | $206.10" [ref=e628]:
                          - generic [ref=e630]:
                            - text: 0610DR029
                            - generic [ref=e631]: Black
                            - generic [ref=e632]: S
                            - generic [ref=e633]: × 1
                            - generic [ref=e634]: "| $206.10"
                        - cell "18-Jul-2026 11:22:16" [ref=e635]
                        - cell "Xiao Li" [ref=e636]
                        - cell "-" [ref=e637]
                        - cell "-" [ref=e638]
                        - 'cell "AMEX: $206.10" [ref=e639]':
                          - generic [ref=e641]: "AMEX: $206.10"
                        - cell "normal" [ref=e642]:
                          - generic [ref=e643]: normal
                        - cell "reprint" [ref=e644]:
                          - button "reprint" [ref=e645] [cursor=pointer]:
                            - generic [ref=e646]: reprint
                        - cell "close-circle void" [ref=e647]:
                          - button "close-circle void" [ref=e648] [cursor=pointer]:
                            - img "close-circle" [ref=e650]:
                              - img [ref=e651]
                            - generic [ref=e653]: void
                      - 'row "1513 OR26071700520006 0423DR054CL Pink S × 1 | $206.10 17-Jul-2026 22:46:34 Gabrielle - - Master: $206.10 normal reprint close-circle void" [ref=e654]':
                        - cell "1513" [ref=e655]
                        - cell "OR26071700520006" [ref=e656]
                        - cell "0423DR054CL Pink S × 1 | $206.10" [ref=e657]:
                          - generic [ref=e659]:
                            - text: 0423DR054CL
                            - generic [ref=e660]: Pink
                            - generic [ref=e661]: S
                            - generic [ref=e662]: × 1
                            - generic [ref=e663]: "| $206.10"
                        - cell "17-Jul-2026 22:46:34" [ref=e664]
                        - cell "Gabrielle" [ref=e665]
                        - cell "-" [ref=e666]
                        - cell "-" [ref=e667]
                        - 'cell "Master: $206.10" [ref=e668]':
                          - generic [ref=e670]: "Master: $206.10"
                        - cell "normal" [ref=e671]:
                          - generic [ref=e672]: normal
                        - cell "reprint" [ref=e673]:
                          - button "reprint" [ref=e674] [cursor=pointer]:
                            - generic [ref=e675]: reprint
                        - cell "close-circle void" [ref=e676]:
                          - button "close-circle void" [ref=e677] [cursor=pointer]:
                            - img "close-circle" [ref=e679]:
                              - img [ref=e680]
                            - generic [ref=e682]: void
                      - 'row "1512 OR26071700520005 0409DR065 White L × 1 | $215.10 17-Jul-2026 21:27:55 Gabrielle - - Master: $215.10 normal reprint close-circle void" [ref=e683]':
                        - cell "1512" [ref=e684]
                        - cell "OR26071700520005" [ref=e685]
                        - cell "0409DR065 White L × 1 | $215.10" [ref=e686]:
                          - generic [ref=e688]:
                            - text: 0409DR065
                            - generic [ref=e689]: White
                            - generic [ref=e690]: L
                            - generic [ref=e691]: × 1
                            - generic [ref=e692]: "| $215.10"
                        - cell "17-Jul-2026 21:27:55" [ref=e693]
                        - cell "Gabrielle" [ref=e694]
                        - cell "-" [ref=e695]
                        - cell "-" [ref=e696]
                        - 'cell "Master: $215.10" [ref=e697]':
                          - generic [ref=e699]: "Master: $215.10"
                        - cell "normal" [ref=e700]:
                          - generic [ref=e701]: normal
                        - cell "reprint" [ref=e702]:
                          - button "reprint" [ref=e703] [cursor=pointer]:
                            - generic [ref=e704]: reprint
                        - cell "close-circle void" [ref=e705]:
                          - button "close-circle void" [ref=e706] [cursor=pointer]:
                            - img "close-circle" [ref=e708]:
                              - img [ref=e709]
                            - generic [ref=e711]: void
                      - 'row "1511 OR26071700520004 0113TB020 White M × 1 | $139.00 17-Jul-2026 20:17:04 Gabrielle - - VISA: $139.00 normal reprint close-circle void" [ref=e712]':
                        - cell "1511" [ref=e713]
                        - cell "OR26071700520004" [ref=e714]
                        - cell "0113TB020 White M × 1 | $139.00" [ref=e715]:
                          - generic [ref=e717]:
                            - text: 0113TB020
                            - generic [ref=e718]: White
                            - generic [ref=e719]: M
                            - generic [ref=e720]: × 1
                            - generic [ref=e721]: "| $139.00"
                        - cell "17-Jul-2026 20:17:04" [ref=e722]
                        - cell "Gabrielle" [ref=e723]
                        - cell "-" [ref=e724]
                        - cell "-" [ref=e725]
                        - 'cell "VISA: $139.00" [ref=e726]':
                          - generic [ref=e728]: "VISA: $139.00"
                        - cell "normal" [ref=e729]:
                          - generic [ref=e730]: normal
                        - cell "reprint" [ref=e731]:
                          - button "reprint" [ref=e732] [cursor=pointer]:
                            - generic [ref=e733]: reprint
                        - cell "close-circle void" [ref=e734]:
                          - button "close-circle void" [ref=e735] [cursor=pointer]:
                            - img "close-circle" [ref=e737]:
                              - img [ref=e738]
                            - generic [ref=e740]: void
                      - 'row "1510 OR26071700520003 Q541JK018 White Free Size × 1 | $206.10 17-Jul-2026 18:25:35 Xiao Li - - VISA: $206.10 normal reprint close-circle void" [ref=e741]':
                        - cell "1510" [ref=e742]
                        - cell "OR26071700520003" [ref=e743]
                        - cell "Q541JK018 White Free Size × 1 | $206.10" [ref=e744]:
                          - generic [ref=e746]:
                            - text: Q541JK018
                            - generic [ref=e747]: White
                            - generic [ref=e748]: Free Size
                            - generic [ref=e749]: × 1
                            - generic [ref=e750]: "| $206.10"
                        - cell "17-Jul-2026 18:25:35" [ref=e751]
                        - cell "Xiao Li" [ref=e752]
                        - cell "-" [ref=e753]
                        - cell "-" [ref=e754]
                        - 'cell "VISA: $206.10" [ref=e755]':
                          - generic [ref=e757]: "VISA: $206.10"
                        - cell "normal" [ref=e758]:
                          - generic [ref=e759]: normal
                        - cell "reprint" [ref=e760]:
                          - button "reprint" [ref=e761] [cursor=pointer]:
                            - generic [ref=e762]: reprint
                        - cell "close-circle void" [ref=e763]:
                          - button "close-circle void" [ref=e764] [cursor=pointer]:
                            - img "close-circle" [ref=e766]:
                              - img [ref=e767]
                            - generic [ref=e769]: void
                      - 'row "1509 OR26071700520002 SLADR012 Purple S × 1 | $100.00 17-Jul-2026 17:55:08 Gabrielle 98200778 98200778 Master: $100.00 normal reprint close-circle void" [ref=e770]':
                        - cell "1509" [ref=e771]
                        - cell "OR26071700520002" [ref=e772]
                        - cell "SLADR012 Purple S × 1 | $100.00" [ref=e773]:
                          - generic [ref=e775]:
                            - text: SLADR012
                            - generic [ref=e776]: Purple
                            - generic [ref=e777]: S
                            - generic [ref=e778]: × 1
                            - generic [ref=e779]: "| $100.00"
                        - cell "17-Jul-2026 17:55:08" [ref=e780]
                        - cell "Gabrielle" [ref=e781]
                        - cell "98200778" [ref=e782]
                        - cell "98200778" [ref=e783]
                        - 'cell "Master: $100.00" [ref=e784]':
                          - generic [ref=e786]: "Master: $100.00"
                        - cell "normal" [ref=e787]:
                          - generic [ref=e788]: normal
                        - cell "reprint" [ref=e789]:
                          - button "reprint" [ref=e790] [cursor=pointer]:
                            - generic [ref=e791]: reprint
                        - cell "close-circle void" [ref=e792]:
                          - button "close-circle void" [ref=e793] [cursor=pointer]:
                            - img "close-circle" [ref=e795]:
                              - img [ref=e796]
                            - generic [ref=e798]: void
                      - 'row "1508 OR26071700520001 0423DR072 Grey M × 1 | $100.00 0405DR004 Black M × 1 | $100.00 17-Jul-2026 15:21:45 Gabrielle - - Master: $200.00 normal reprint close-circle void" [ref=e799]':
                        - cell "1508" [ref=e800]
                        - cell "OR26071700520001" [ref=e801]
                        - cell "0423DR072 Grey M × 1 | $100.00 0405DR004 Black M × 1 | $100.00" [ref=e802]:
                          - generic [ref=e803]:
                            - generic [ref=e804]:
                              - text: 0423DR072
                              - generic [ref=e805]: Grey
                              - generic [ref=e806]: M
                              - generic [ref=e807]: × 1
                              - generic [ref=e808]: "| $100.00"
                            - generic [ref=e809]:
                              - text: 0405DR004
                              - generic [ref=e810]: Black
                              - generic [ref=e811]: M
                              - generic [ref=e812]: × 1
                              - generic [ref=e813]: "| $100.00"
                        - cell "17-Jul-2026 15:21:45" [ref=e814]
                        - cell "Gabrielle" [ref=e815]
                        - cell "-" [ref=e816]
                        - cell "-" [ref=e817]
                        - 'cell "Master: $200.00" [ref=e818]':
                          - generic [ref=e820]: "Master: $200.00"
                        - cell "normal" [ref=e821]:
                          - generic [ref=e822]: normal
                        - cell "reprint" [ref=e823]:
                          - button "reprint" [ref=e824] [cursor=pointer]:
                            - generic [ref=e825]: reprint
                        - cell "close-circle void" [ref=e826]:
                          - button "close-circle void" [ref=e827] [cursor=pointer]:
                            - img "close-circle" [ref=e829]:
                              - img [ref=e830]
                            - generic [ref=e832]: void
                      - 'row "1507 OR26071600520005 0411TB173 White M × 1 | $159.00 3115DR021 Red M × 1 | $289.00 16-Jul-2026 21:58:09 Gabrielle - - VISA: $448.00 normal reprint close-circle void" [ref=e833]':
                        - cell "1507" [ref=e834]
                        - cell "OR26071600520005" [ref=e835]
                        - cell "0411TB173 White M × 1 | $159.00 3115DR021 Red M × 1 | $289.00" [ref=e836]:
                          - generic [ref=e837]:
                            - generic [ref=e838]:
                              - text: 0411TB173
                              - generic [ref=e839]: White
                              - generic [ref=e840]: M
                              - generic [ref=e841]: × 1
                              - generic [ref=e842]: "| $159.00"
                            - generic [ref=e843]:
                              - text: 3115DR021
                              - generic [ref=e844]: Red
                              - generic [ref=e845]: M
                              - generic [ref=e846]: × 1
                              - generic [ref=e847]: "| $289.00"
                        - cell "16-Jul-2026 21:58:09" [ref=e848]
                        - cell "Gabrielle" [ref=e849]
                        - cell "-" [ref=e850]
                        - cell "-" [ref=e851]
                        - 'cell "VISA: $448.00" [ref=e852]':
                          - generic [ref=e854]: "VISA: $448.00"
                        - cell "normal" [ref=e855]:
                          - generic [ref=e856]: normal
                        - cell "reprint" [ref=e857]:
                          - button "reprint" [ref=e858] [cursor=pointer]:
                            - generic [ref=e859]: reprint
                        - cell "close-circle void" [ref=e860]:
                          - button "close-circle void" [ref=e861] [cursor=pointer]:
                            - img "close-circle" [ref=e863]:
                              - img [ref=e864]
                            - generic [ref=e866]: void
                      - 'row "1506 OR26071600520004 0113DR066 Black L × 1 | $233.10 16-Jul-2026 16:50:38 Xiao Li - - VISA: $233.10 normal reprint close-circle void" [ref=e867]':
                        - cell "1506" [ref=e868]
                        - cell "OR26071600520004" [ref=e869]
                        - cell "0113DR066 Black L × 1 | $233.10" [ref=e870]:
                          - generic [ref=e872]:
                            - text: 0113DR066
                            - generic [ref=e873]: Black
                            - generic [ref=e874]: L
                            - generic [ref=e875]: × 1
                            - generic [ref=e876]: "| $233.10"
                        - cell "16-Jul-2026 16:50:38" [ref=e877]
                        - cell "Xiao Li" [ref=e878]
                        - cell "-" [ref=e879]
                        - cell "-" [ref=e880]
                        - 'cell "VISA: $233.10" [ref=e881]':
                          - generic [ref=e883]: "VISA: $233.10"
                        - cell "normal" [ref=e884]:
                          - generic [ref=e885]: normal
                        - cell "reprint" [ref=e886]:
                          - button "reprint" [ref=e887] [cursor=pointer]:
                            - generic [ref=e888]: reprint
                        - cell "close-circle void" [ref=e889]:
                          - button "close-circle void" [ref=e890] [cursor=pointer]:
                            - img "close-circle" [ref=e892]:
                              - img [ref=e893]
                            - generic [ref=e895]: void
            - list [ref=e899]:
              - listitem [ref=e900]: 第 1-20 条/共 1037 条
              - listitem "Previous Page" [ref=e901]:
                - button "left" [disabled] [ref=e902]:
                  - img "left" [ref=e903]:
                    - img [ref=e904]
              - listitem "1" [ref=e906] [cursor=pointer]:
                - generic [ref=e907]: "1"
              - listitem "2" [ref=e908] [cursor=pointer]:
                - generic [ref=e909]: "2"
              - listitem "3" [ref=e910] [cursor=pointer]:
                - generic [ref=e911]: "3"
              - listitem "4" [ref=e912] [cursor=pointer]:
                - generic [ref=e913]: "4"
              - listitem "5" [ref=e914] [cursor=pointer]:
                - generic [ref=e915]: "5"
              - listitem "Next 5 Pages" [ref=e916] [cursor=pointer]:
                - generic [ref=e918]:
                  - img "double-right" [ref=e919]:
                    - img [ref=e920]
                  - generic [ref=e922]: •••
              - listitem "52" [ref=e923] [cursor=pointer]:
                - generic [ref=e924]: "52"
              - listitem "Next Page" [ref=e925] [cursor=pointer]:
                - button "right" [ref=e926]:
                  - img "right" [ref=e927]:
                    - img [ref=e928]
              - listitem [ref=e930]:
                - generic [ref=e931]:
                  - text: Go to
                  - textbox "Page" [ref=e932]
                  - text: Page
  - alert [ref=e933]
  - dialog [ref=e935]:
    - generic [ref=e937]:
      - button "Close" [ref=e938] [cursor=pointer]:
        - img "close" [ref=e939]:
          - img [ref=e940]
      - generic [ref=e942]: Return Order
    - generic [ref=e944]:
      - button "plus 添加商品" [ref=e950] [cursor=pointer]:
        - img "plus" [ref=e952]:
          - img [ref=e953]
        - generic [ref=e956]: 添加商品
      - generic [ref=e958]:
        - generic "Operator" [ref=e960]: "* Operator"
        - generic [ref=e964] [cursor=pointer]:
          - generic [ref=e966]:
            - combobox "* Operator" [ref=e968]
            - generic: Please enter operator
          - generic:
            - img:
              - img
    - generic [ref=e970]:
      - button "Cancel" [ref=e971] [cursor=pointer]:
        - generic [ref=e972]: Cancel
      - button "Confirm" [ref=e973] [cursor=pointer]:
        - generic [ref=e974]: Confirm
```

# Test source

```ts
  91  |       // 检查是否有错误边界显示
  92  |       const errorBoundary = page.locator('text=组件加载出错').or(page.locator('text=Error'));
  93  |       const hasError = await errorBoundary.isVisible().catch(() => false);
  94  |       expect(hasError).toBe(false);
  95  |     }
  96  |     
  97  |     console.log('✅ 测试通过：输入各种字符都不崩溃');
  98  |   });
  99  | 
  100 |   test('测试3: 快速连续输入不崩溃', async ({ page }) => {
  101 |     console.log('开始测试：快速连续输入');
  102 |     
  103 |     // 导航到销售订单页面
  104 |     await page.goto(`${PROD_URL}?page=billManagement`);
  105 |     await page.waitForLoadState('networkidle');
  106 |     
  107 |     // 打开退货订单抽屉
  108 |     const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
  109 |     await returnOrderButton.click();
  110 |     await page.waitForSelector('.ant-drawer', { timeout: 10000 });
  111 |     
  112 |     // 添加商品
  113 |     const addProductButton = page.getByText('添加商品').or(page.getByText('Add Product'));
  114 |     await addProductButton.click();
  115 |     
  116 |     // 获取输入框
  117 |     const codeInput = page.locator('.ant-select-auto-complete input, .ant-autocomplete input').first();
  118 |     
  119 |     // 快速输入多个字符
  120 |     await codeInput.type('ABCDEFGHIJK', { delay: 50 });
  121 |     
  122 |     // 等待一下
  123 |     await page.waitForTimeout(1000);
  124 |     
  125 |     // 验证页面没有崩溃
  126 |     const drawerStillVisible = await page.locator('.ant-drawer').isVisible();
  127 |     expect(drawerStillVisible).toBe(true);
  128 |     
  129 |     // 检查控制台错误
  130 |     const errorBoundary = page.locator('text=组件加载出错');
  131 |     const hasError = await errorBoundary.isVisible().catch(() => false);
  132 |     expect(hasError).toBe(false);
  133 |     
  134 |     console.log('✅ 测试通过：快速输入不崩溃');
  135 |   });
  136 | 
  137 |   test('测试4: 添加多个商品行不崩溃', async ({ page }) => {
  138 |     console.log('开始测试：添加多个商品行');
  139 |     
  140 |     // 导航到销售订单页面
  141 |     await page.goto(`${PROD_URL}?page=billManagement`);
  142 |     await page.waitForLoadState('networkidle');
  143 |     
  144 |     // 打开退货订单抽屉
  145 |     const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
  146 |     await returnOrderButton.click();
  147 |     await page.waitForSelector('.ant-drawer', { timeout: 10000 });
  148 |     
  149 |     // 添加3个商品行
  150 |     for (let i = 0; i < 3; i++) {
  151 |       console.log(`  添加第 ${i + 1} 个商品行`);
  152 |       const addProductButton = page.getByText('添加商品').or(page.getByText('Add Product'));
  153 |       await addProductButton.click();
  154 |       await page.waitForTimeout(300);
  155 |     }
  156 |     
  157 |     // 获取所有商品代码输入框
  158 |     const codeInputs = page.locator('.ant-select-auto-complete input, .ant-autocomplete input');
  159 |     const count = await codeInputs.count();
  160 |     
  161 |     console.log(`  找到 ${count} 个输入框`);
  162 |     expect(count).toBeGreaterThanOrEqual(3);
  163 |     
  164 |     // 在每个输入框中输入内容
  165 |     for (let i = 0; i < Math.min(count, 3); i++) {
  166 |       await codeInputs.nth(i).fill(`TEST${i + 1}`);
  167 |       await page.waitForTimeout(200);
  168 |     }
  169 |     
  170 |     // 验证页面没有崩溃
  171 |     const drawerStillVisible = await page.locator('.ant-drawer').isVisible();
  172 |     expect(drawerStillVisible).toBe(true);
  173 |     
  174 |     console.log('✅ 测试通过：添加多个商品行不崩溃');
  175 |   });
  176 | 
  177 |   test('测试5: 选择操作员不崩溃', async ({ page }) => {
  178 |     console.log('开始测试：选择操作员');
  179 |     
  180 |     // 导航到销售订单页面
  181 |     await page.goto(`${PROD_URL}?page=billManagement`);
  182 |     await page.waitForLoadState('networkidle');
  183 |     
  184 |     // 打开退货订单抽屉
  185 |     const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
  186 |     await returnOrderButton.click();
  187 |     await page.waitForSelector('.ant-drawer', { timeout: 10000 });
  188 |     
  189 |     // 查找操作员下拉框
  190 |     const operatorLabel = page.locator('text=操作员').or(page.locator('text=Operator'));
> 191 |     await expect(operatorLabel).toBeVisible();
      |                                 ^ Error: expect(locator).toBeVisible() failed
  192 |     
  193 |     // 点击操作员下拉框
  194 |     const operatorSelect = page.locator('.ant-form-item').filter({ hasText: /操作员|Operator/ }).locator('.ant-select');
  195 |     await operatorSelect.click();
  196 |     
  197 |     // 等待下拉菜单出现
  198 |     await page.waitForSelector('.ant-select-dropdown', { timeout: 5000 });
  199 |     
  200 |     // 验证下拉菜单中有选项
  201 |     const options = page.locator('.ant-select-dropdown .ant-select-item');
  202 |     const optionCount = await options.count();
  203 |     
  204 |     console.log(`  找到 ${optionCount} 个操作员选项`);
  205 |     expect(optionCount).toBeGreaterThan(0);
  206 |     
  207 |     // 选择第一个选项
  208 |     if (optionCount > 0) {
  209 |       await options.first().click();
  210 |     }
  211 |     
  212 |     // 验证页面没有崩溃
  213 |     const drawerStillVisible = await page.locator('.ant-drawer').isVisible();
  214 |     expect(drawerStillVisible).toBe(true);
  215 |     
  216 |     console.log('✅ 测试通过：选择操作员不崩溃');
  217 |   });
  218 | 
  219 |   test('测试6: 关闭抽屉正常工作', async ({ page }) => {
  220 |     console.log('开始测试：关闭抽屉');
  221 |     
  222 |     // 导航到销售订单页面
  223 |     await page.goto(`${PROD_URL}?page=billManagement`);
  224 |     await page.waitForLoadState('networkidle');
  225 |     
  226 |     // 打开退货订单抽屉
  227 |     const returnOrderButton = page.getByRole('button', { name: /Return Order|退货订单/ }).first();
  228 |     await returnOrderButton.click();
  229 |     await page.waitForSelector('.ant-drawer', { timeout: 10000 });
  230 |     
  231 |     // 点击取消按钮
  232 |     const cancelButton = page.getByText('取消').or(page.getByText('Cancel'));
  233 |     await cancelButton.click();
  234 |     
  235 |     // 验证抽屉已关闭
  236 |     await page.waitForTimeout(500);
  237 |     const drawerVisible = await page.locator('.ant-drawer').isVisible().catch(() => false);
  238 |     expect(drawerVisible).toBe(false);
  239 |     
  240 |     console.log('✅ 测试通过：关闭抽屉正常工作');
  241 |   });
  242 | });
  243 | 
```